/**
 * Minimal dependency-free WebGL2 renderer for the `.pdm` meshes produced by
 * scripts/stl-to-mesh.ts — a few kilobytes of code instead of a 3D library.
 *
 * Design notes:
 * - Positions are uint16 and normalised by the GPU, so the vertex buffer is the
 *   file contents verbatim; no per-vertex work happens on the main thread.
 * - Normals are not stored. The fragment shader derives a flat normal from the
 *   screen-space derivatives of the view position, which suits a 3D printed
 *   part and keeps the payload small.
 * - Lights sit in view space, so the part stays readable at every orbit angle.
 * - Frames are only drawn when something changed; an idle viewer costs nothing.
 */

export type Viewer = {
  /** Applies a new base colour, e.g. when the customer picks another variant. */
  setColor: (hex: string) => void;
  /** Returns the camera to the framing used on load. */
  reset: () => void;
  /** Suspends the render loop while the viewer is scrolled out of view. */
  setPaused: (paused: boolean) => void;
  /** Stops the render loop and releases all GPU resources. */
  dispose: () => void;
};

export type MeshData = {
  positions: Uint16Array;
  indices: Uint16Array | Uint32Array;
  /** Bounding box origin in millimetres (informational). */
  min: [number, number, number];
  /** Bounding box size in millimetres; also the uint16 dequantisation scale. */
  extent: [number, number, number];
};

export type ViewerOptions = {
  canvas: HTMLCanvasElement;
  mesh: MeshData;
  color: string;
  /** Slow idle spin until the first interaction; skipped for reduced motion. */
  autoRotate?: boolean;
  /** Fired once, the first time the visitor moves the camera themselves. */
  onInteract?: () => void;
};

const MAGIC = 0x314d4450; // "PDM1"
const HEADER_BYTES = 40;

/** Vertical field of view in radians (35°). */
const FIELD_OF_VIEW = 0.611;
const MIN_ZOOM = 0.55;
const MAX_ZOOM = 3.2;
/** Keeps the camera clear of the poles, where orbiting would gimbal-lock. */
const MAX_PITCH = Math.PI / 2 - 0.05;
const AUTO_ROTATE_SPEED = 0.22; // radians per second
/** Share of the remaining distance covered per 60 Hz frame. */
const DAMPING = 0.16;
const SETTLED = 1e-4;

export function parseMesh(buffer: ArrayBuffer): MeshData {
  const view = new DataView(buffer);
  if (buffer.byteLength < HEADER_BYTES || view.getUint32(0, true) !== MAGIC) {
    throw new Error("Not a .pdm mesh");
  }
  const vertexCount = view.getUint32(4, true);
  const indexCount = view.getUint32(8, true);
  const indexBytes = view.getUint8(12);

  const min: [number, number, number] = [
    view.getFloat32(16, true),
    view.getFloat32(20, true),
    view.getFloat32(24, true),
  ];
  const extent: [number, number, number] = [
    view.getFloat32(28, true),
    view.getFloat32(32, true),
    view.getFloat32(36, true),
  ];

  const positionBytes = vertexCount * 3 * 2;
  // The writer pads the positions so the index array is 4 byte aligned.
  const indexOffset = HEADER_BYTES + positionBytes + ((4 - ((HEADER_BYTES + positionBytes) % 4)) % 4);
  const positions = new Uint16Array(buffer, HEADER_BYTES, vertexCount * 3);
  const indices =
    indexBytes === 2
      ? new Uint16Array(buffer, indexOffset, indexCount)
      : new Uint32Array(buffer, indexOffset, indexCount);

  return { positions, indices, min, extent };
}

const VERTEX_SHADER = `#version 300 es
in vec3 aPosition;
uniform mat4 uViewProjection;
uniform mat4 uView;
// Maps the normalised uint16 positions back to millimetres around the centre.
uniform vec3 uExtent;
uniform vec3 uOffset;
out vec3 vViewPosition;
void main() {
  vec3 position = aPosition * uExtent + uOffset;
  vViewPosition = (uView * vec4(position, 1.0)).xyz;
  gl_Position = uViewProjection * vec4(position, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision mediump float;
// Both are highp on purpose: the uniform must match the vertex stage, and the
// derivative-based normal needs the range – mediump really is 16 bit on some mobile GPUs,
// which would quantise positions of this magnitude into visible facets.
in highp vec3 vViewPosition;
uniform highp mat4 uView;
uniform vec3 uColor;
out vec4 outColor;

/** Key light in view space: slightly above and left of the camera. */
const vec3 KEY_LIGHT = vec3(-0.35, 0.45, 0.82);

void main() {
  // Flat per-triangle normal, reconstructed from the screen-space gradient.
  vec3 normal = normalize(cross(dFdx(vViewPosition), dFdy(vViewPosition)));
  // Back faces are culled, so the visible normal always points at the camera.
  normal *= sign(normal.z);

  // Back into world space – the view rotation is orthonormal, so multiplying
  // from the right transposes it. Keeps "up" fixed while the camera orbits.
  float up = (normal * mat3(uView)).y;

  // A hemispheric ambient carries the overall brightness, so light variants
  // still read as light; the single key light supplies the form. Together they
  // peak at 1.12, which only the near-white variant reaches, and only on faces
  // pointing straight up.
  float sky = up * 0.5 + 0.5;
  float key = max(dot(normal, normalize(KEY_LIGHT)), 0.0);
  // Grazing angles brighten slightly so the silhouette reads without a shadow.
  float rim = pow(1.0 - max(normal.z, 0.0), 3.0);

  outColor = vec4(uColor * (0.46 + sky * 0.30 + key * 0.36) + rim * 0.10, 1.0);
}`;

/** #rrggbb -> sRGB 0..1 triple. Falls back to mid grey on malformed input. */
function parseColor(hex: string): [number, number, number] {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return [0.54, 0.56, 0.6];
  const value = parseInt(match[1], 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Could not create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return shader;
}

function link(gl: WebGL2RenderingContext): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error("Could not create program");
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  // The compiled stages live on inside the linked program.
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link failed: ${log}`);
  }
  return program;
}

/** Column-major perspective projection, matching WebGL's uniform layout. */
function perspective(out: Float32Array, aspect: number, near: number, far: number): void {
  const f = 1 / Math.tan(FIELD_OF_VIEW / 2);
  out.fill(0);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) / (near - far);
  out[11] = -1;
  out[14] = (2 * far * near) / (near - far);
}

/** View matrix for a camera at `eye` looking at the origin, Y-up. */
function lookAtOrigin(out: Float32Array, eye: [number, number, number]): void {
  const length = Math.hypot(eye[0], eye[1], eye[2]) || 1;
  // Camera Z points from the target back towards the eye.
  const zx = eye[0] / length;
  const zy = eye[1] / length;
  const zz = eye[2] / length;
  // Right = normalize(cross(worldUp, z)); the pitch clamp keeps these apart.
  const rightLength = Math.hypot(zz, zx) || 1;
  const xx = zz / rightLength;
  const xy = 0;
  const xz = -zx / rightLength;
  // Up = cross(z, right).
  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;

  out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
  out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
  out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
  out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
  out[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
  out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
  out[15] = 1;
}

function multiply(out: Float32Array, a: Float32Array, b: Float32Array): void {
  for (let column = 0; column < 4; column++) {
    const b0 = b[column * 4];
    const b1 = b[column * 4 + 1];
    const b2 = b[column * 4 + 2];
    const b3 = b[column * 4 + 3];
    for (let row = 0; row < 4; row++) {
      out[column * 4 + row] = a[row] * b0 + a[4 + row] * b1 + a[8 + row] * b2 + a[12 + row] * b3;
    }
  }
}

export function createViewer({ canvas, mesh, color, autoRotate = true, onInteract }: ViewerOptions): Viewer {
  const context = canvas.getContext("webgl2", { antialias: true, alpha: true, powerPreference: "low-power" });
  if (!context) throw new Error("WebGL2 is not available");
  // Re-bound so the non-null type survives into the nested render functions.
  const gl: WebGL2RenderingContext = context;

  const program = link(gl);
  const uniforms = {
    viewProjection: gl.getUniformLocation(program, "uViewProjection"),
    view: gl.getUniformLocation(program, "uView"),
    extent: gl.getUniformLocation(program, "uExtent"),
    offset: gl.getUniformLocation(program, "uOffset"),
    color: gl.getUniformLocation(program, "uColor"),
  };

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);
  const positionLocation = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(positionLocation);
  // `normalized = true` turns the uint16 grid into 0..1 for free on the GPU.
  gl.vertexAttribPointer(positionLocation, 3, gl.UNSIGNED_SHORT, true, 0, 0);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
  const indexType = mesh.indices instanceof Uint16Array ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT;

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  // Positions arrive as 0..1 * extent, so shifting by half the box centres the
  // part on the origin and orbiting rotates around its middle.
  const offset = new Float32Array([-mesh.extent[0] / 2, -mesh.extent[1] / 2, -mesh.extent[2] / 2]);
  const extent = new Float32Array(mesh.extent);
  const radius = Math.hypot(...mesh.extent) / 2;
  /**
   * Distance at which the bounding sphere fills the vertical field, plus a
   * margin so the part never touches the canvas edge at an unlucky angle.
   */
  const baseDistance = (radius / Math.sin(FIELD_OF_VIEW / 2)) * 1.12;

  const projectionMatrix = new Float32Array(16);
  const viewMatrix = new Float32Array(16);
  const viewProjectionMatrix = new Float32Array(16);

  /** Three-quarter view from slightly above — the standard product angle. */
  const HOME = { yaw: 0.7, pitch: 0.42, zoom: 1 };
  const target = { ...HOME };
  const current = { ...HOME };
  let rgb = parseColor(color);

  let frame = 0;
  let lastTime = 0;
  let paused = false;
  let disposed = false;
  let spinning = autoRotate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize(): void {
    // Cap the device pixel ratio: past 2x the extra fill cost buys nothing here.
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
  }

  function draw(): void {
    resize();
    const aspect = canvas.width / canvas.height || 1;
    const distance = baseDistance * current.zoom;
    perspective(projectionMatrix, aspect, distance - radius * 1.6, distance + radius * 2.2);

    const cosPitch = Math.cos(current.pitch);
    lookAtOrigin(viewMatrix, [
      distance * cosPitch * Math.sin(current.yaw),
      distance * Math.sin(current.pitch),
      distance * cosPitch * Math.cos(current.yaw),
    ]);
    multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.uniformMatrix4fv(uniforms.viewProjection, false, viewProjectionMatrix);
    gl.uniformMatrix4fv(uniforms.view, false, viewMatrix);
    gl.uniform3fv(uniforms.extent, extent);
    gl.uniform3fv(uniforms.offset, offset);
    gl.uniform3fv(uniforms.color, rgb);
    gl.drawElements(gl.TRIANGLES, mesh.indices.length, indexType, 0);
  }

  /** Advances the damped camera and reports whether it is still moving. */
  function advance(deltaSeconds: number): boolean {
    if (spinning) target.yaw += AUTO_ROTATE_SPEED * deltaSeconds;
    // Frame-rate independent damping, normalised to 60 Hz.
    const factor = 1 - Math.pow(1 - DAMPING, deltaSeconds * 60);
    let moving = false;
    for (const key of ["yaw", "pitch", "zoom"] as const) {
      const difference = target[key] - current[key];
      if (Math.abs(difference) < SETTLED) {
        current[key] = target[key];
        continue;
      }
      current[key] += difference * factor;
      moving = true;
    }
    return moving || spinning;
  }

  function tick(time: number): void {
    if (disposed) return;
    const deltaSeconds = lastTime ? Math.min((time - lastTime) / 1000, 0.1) : 1 / 60;
    lastTime = time;
    const moving = advance(deltaSeconds);
    draw();
    // An idle camera stops the loop instead of burning frames at 60 Hz.
    frame = moving && !paused ? requestAnimationFrame(tick) : 0;
  }

  function invalidate(): void {
    if (disposed || paused || frame) return;
    lastTime = 0;
    frame = requestAnimationFrame(tick);
  }

  // --- Interaction -----------------------------------------------------------

  const pointers = new Map<number, { x: number; y: number }>();
  let pinchDistance = 0;

  let interacted = false;

  /** Stops the idle spin and tells the host the visitor has taken over. */
  function takeOver(): void {
    spinning = false;
    if (interacted) return;
    interacted = true;
    onInteract?.();
  }

  function orbitBy(deltaYaw: number, deltaPitch: number): void {
    takeOver();
    target.yaw += deltaYaw;
    target.pitch = Math.min(MAX_PITCH, Math.max(-MAX_PITCH, target.pitch + deltaPitch));
    invalidate();
  }

  function zoomBy(factor: number): void {
    takeOver();
    target.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, target.zoom * factor));
    invalidate();
  }

  function reset(): void {
    takeOver();
    // Unwind the accumulated spin to the nearest equivalent angle, so resetting
    // takes the short way round instead of rewinding every full turn.
    current.yaw = HOME.yaw + Math.round((current.yaw - HOME.yaw) / (Math.PI * 2)) * Math.PI * 2;
    Object.assign(target, HOME);
    invalidate();
  }

  function pointerSpread(): number {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function onPointerDown(event: PointerEvent): void {
    takeOver();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    canvas.setPointerCapture(event.pointerId);
    if (pointers.size === 2) pinchDistance = pointerSpread();
  }

  function onPointerMove(event: PointerEvent): void {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size >= 2) {
      const spread = pointerSpread();
      if (pinchDistance > 0 && spread > 0) zoomBy(pinchDistance / spread);
      pinchDistance = spread;
      return;
    }
    // Dragging the full canvas width is a bit more than half a turn.
    orbitBy((dx / (canvas.clientWidth || 1)) * 4, (dy / (canvas.clientHeight || 1)) * 3);
  }

  function onPointerUp(event: PointerEvent): void {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinchDistance = 0;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  }

  function onWheel(event: WheelEvent): void {
    // Only take over the wheel for a deliberate zoom (trackpad pinch sets
    // ctrlKey) or once the viewer is focused — otherwise the page must scroll.
    if (!event.ctrlKey && document.activeElement !== canvas) return;
    event.preventDefault();
    zoomBy(Math.exp(event.deltaY * 0.0012));
  }

  function onKeyDown(event: KeyboardEvent): void {
    const amount = event.shiftKey ? 0.35 : 0.15;
    switch (event.key) {
      case "ArrowLeft": orbitBy(-amount, 0); break;
      case "ArrowRight": orbitBy(amount, 0); break;
      case "ArrowUp": orbitBy(0, -amount); break;
      case "ArrowDown": orbitBy(0, amount); break;
      case "+": case "=": zoomBy(0.88); break;
      case "-": case "_": zoomBy(1.14); break;
      case "0": reset(); break;
      default: return;
    }
    event.preventDefault();
  }

  function onContextLost(event: Event): void {
    // Without preventDefault the browser never fires `webglcontextrestored`.
    event.preventDefault();
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  // A backgrounded tab may drop the drawing buffer; repaint when it returns.
  function onVisibilityChange(): void {
    if (!document.hidden) invalidate();
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("keydown", onKeyDown);
  canvas.addEventListener("webglcontextlost", onContextLost);
  document.addEventListener("visibilitychange", onVisibilityChange);

  const observer = new ResizeObserver(() => invalidate());
  observer.observe(canvas);

  invalidate();

  return {
    setColor(hex: string) {
      rgb = parseColor(hex);
      invalidate();
    },
    reset,
    setPaused(next: boolean) {
      paused = next;
      if (paused) {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
      } else {
        invalidate();
      }
    },
    dispose() {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(indexBuffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
