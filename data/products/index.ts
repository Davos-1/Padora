/**
 * Registry of all product JSON files. Imported at build time so the catalogue
 * works on Cloudflare Workers (no filesystem access at runtime).
 * Add every new file here – `pnpm validate:products` fails if one is missing.
 */
import gitterBasis from "./gitter-basis.json";
import overgripEinzeln from "./overgrip-einzeln.json";
import overgrips3erSet from "./overgrips-3er-set.json";
import padelcamGlashalter from "./padelcam-glashalter.json";
import padelcamSchwalbenschwanz from "./padelcam-schwalbenschwanz.json";
import racketHalter from "./racket-halter.json";

/** [source file name, raw JSON] – the name is used in validation errors. */
export const rawProducts: ReadonlyArray<readonly [string, unknown]> = [
  ["gitter-basis.json", gitterBasis],
  ["overgrip-einzeln.json", overgripEinzeln],
  ["overgrips-3er-set.json", overgrips3erSet],
  ["padelcam-glashalter.json", padelcamGlashalter],
  ["padelcam-schwalbenschwanz.json", padelcamSchwalbenschwanz],
  ["racket-halter.json", racketHalter],
];
