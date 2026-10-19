export type ZoneId = "glas" | "gitter" | "racket";
export type ZoneSelection = ZoneId | "";

type Vec3 = readonly [number, number, number];

/** Camera targets and hotspot anchors of the interactive 3D court (metres). */
export const ZONES: Record<ZoneId, { label: string; pos: Vec3; target: Vec3; off: Vec3 }> = {
  glas: { label: "Glaswand · PadelCam Glas", pos: [0, 1.75, -9.9], target: [0, 1.4, -8.6], off: [2.4, 2.2, 7.2] },
  gitter: { label: "Gitter · Basis + PadelCam", pos: [4.93, 1.55, -3], target: [4.4, 1.3, -3], off: [-6.4, 2.4, 2.4] },
  racket: { label: "Gitter · Racket-Halter", pos: [-4.93, 1.15, 3], target: [-4.4, 1.0, 3], off: [6.4, 2.2, -2.4] },
};

export const ZONE_IDS = Object.keys(ZONES) as ZoneId[];

export const HOME_VIEW = { target: [0, 0.4, 0], off: [15.5, 15, 17] } as const satisfies {
  target: Vec3;
  off: Vec3;
};
