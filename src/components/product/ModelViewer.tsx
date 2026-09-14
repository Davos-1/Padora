"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createViewer, parseMesh, type Viewer } from "@/lib/mesh-viewer";

type Props = {
  /** Path to a `.pdm` mesh under /public/models. */
  src: string;
  /** Product image shown before the viewer is ready and wherever it cannot run. */
  poster: string;
  alt: string;
  /** Base colour of the model, usually the selected variant. */
  color: string;
  priority?: boolean;
};

/**
 * Client island around src/lib/mesh-viewer.ts. The poster image is rendered
 * server-side and stays visible until the viewer has painted its first frame,
 * so the slot never shifts and browsers without WebGL2 (or without JS) simply
 * keep the photo.
 */
export function ModelViewer({ src, poster, alt, color, priority = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const colorRef = useRef(color);
  const [ready, setReady] = useState(false);
  const [moved, setMoved] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Bail out before downloading the mesh if the GPU path is unavailable.
    if (!canvas.getContext("webgl2")) return;

    let cancelled = false;
    let started = false;
    const controller = new AbortController();

    async function start() {
      try {
        const response = await fetch(src, { signal: controller.signal });
        if (!response.ok) throw new Error(`Mesh request failed: ${response.status}`);
        const mesh = parseMesh(await response.arrayBuffer());
        if (cancelled || !canvasRef.current) return;
        viewerRef.current = createViewer({
          canvas: canvasRef.current,
          mesh,
          color: colorRef.current,
          onInteract: () => setMoved(true),
        });
        setReady(true);
      } catch (error) {
        // Any failure just leaves the poster image in place, but say why –
        // a silent fallback is very hard to tell apart from a slow network.
        if (!cancelled && !controller.signal.aborted) {
          console.warn("3D viewer unavailable, showing the product photo instead:", error);
        }
      }
    }

    // Only spin up the GPU once the slot is actually near the viewport, and
    // suspend the render loop again as soon as it scrolls (or is tabbed) away.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        if (visible && !started) {
          started = true;
          void start();
        }
        viewerRef.current?.setPaused(!visible);
      },
      { rootMargin: "200px" },
    );
    observer.observe(container);

    return () => {
      cancelled = true;
      controller.abort();
      observer.disconnect();
      viewerRef.current?.dispose();
      viewerRef.current = null;
      setReady(false);
      setMoved(false);
    };
  }, [src]);

  useEffect(() => {
    colorRef.current = color;
    viewerRef.current?.setColor(color);
  }, [color]);

  return (
    <div ref={containerRef} className="card relative aspect-square overflow-hidden">
      <Image
        src={poster}
        alt={alt}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover"
      />

      {/* Opaque stage on top of the poster – fades in with the first frame. */}
      <div
        className="model-stage absolute inset-0 transition-opacity duration-(--duration-base)"
        style={{ opacity: ready ? 1 : 0 }}
        aria-hidden={!ready}
      >
        <canvas
          ref={canvasRef}
          tabIndex={0}
          role="img"
          aria-label={`Interaktive 3D-Ansicht: ${alt}. Mit den Pfeiltasten drehen, mit Plus und Minus zoomen, mit 0 zurücksetzen.`}
          // pan-y keeps vertical page scrolling intact on touch devices.
          className="size-full cursor-grab touch-pan-y active:cursor-grabbing"
        />
      </div>

      {/* Hint first, reset only once there is something to reset. */}
      {ready && !moved && (
        <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-neutral">
          Ziehen zum Drehen
        </p>
      )}
      {ready && moved && (
        <button
          type="button"
          onClick={() => viewerRef.current?.reset()}
          className="absolute top-3 right-3 flex h-12 items-center rounded-(--radius-pill) border border-line bg-surface px-4 text-xs text-ink hover:border-neutral"
        >
          Ansicht zurücksetzen
        </button>
      )}
    </div>
  );
}
