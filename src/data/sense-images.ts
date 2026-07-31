/**
 * sense-images.ts — which artwork represents each sektor / tendencja.
 * Hand-maintained: scratchpad/curate-sprites.mjs prints both maps below for
 * paste after every sprite re-cut.
 *
 * Removed 2026-07-31: SENSE_IMAGE_MAP + getSenseImageById, and the 18
 * AI-generated still-lifes under public/senses/*.png they pointed at. They
 * were superseded in 2026-07 by the client's own cut-out artwork (below) after
 * the still-lifes read as unreadable murk in the guide card, and had no
 * consumer left — verified absent from the production bundle, not merely
 * un-grepped. `scripts/gen-sense-images.mts` still documents how they were
 * made; recover the art from git history if it is ever wanted again.
 */
import { SPRITE_VER } from "@/lib/asset-version";

/**
 * The CLIENT'S OWN association artwork (vinocompas_graphics/obrazkinut →
 * background-stripped by scratchpad/process-ring.mjs), i.e. the very objects
 * that ring the wheel — bright cut-outs on transparency, so the guide card
 * stays visually identical to the garland the guest just clicked.
 *
 * 12 tendencje only — a sektor card composes its two children. Used as the
 * "is this a tendencja?" key set by ringSpritesFor below.
 */
export const RING_IMAGE_MAP: Record<string, string> = {
  "tegie.cigaro": "/senses/ring/tegie-cigaro.png",
  "tegie.suszone": "/senses/ring/tegie-suszone.png",
  "miekkie.dojrzale": "/senses/ring/miekkie-dojrzale.png",
  "miekkie.konfitury": "/senses/ring/miekkie-konfitury.png",
  "oleiste.maslo": "/senses/ring/oleiste-maslo.png",
  "oleiste.tropikalne": "/senses/ring/oleiste-tropikalne.png",
  "swieze.zielone": "/senses/ring/swieze-zielone.png",
  "swieze.cytrusy": "/senses/ring/swieze-cytrusy.png",
  "ziemiste.mineraly": "/senses/ring/ziemiste-mineraly.png",
  "ziemiste.sciolka": "/senses/ring/ziemiste-sciolka.png",
  "szorstkie.pizmo": "/senses/ring/szorstkie-pizmo.png",
  "szorstkie.dab": "/senses/ring/szorstkie-dab.png",
};

/**
 * How many INDIVIDUAL object sprites each tendencja was cut into by
 * scratchpad/slice-ring2.mjs (public/senses/ring/<tendencja>-<k>.png).
 * The whole images above are internally arranged in 2 rows, so rendering one
 * in a wide band reads as a blob huddled mid-card (client 2026-07-18 "не
 * кучку посредине, нужно в полоску") — the card lays these out in a row
 * instead, echoing the wheel's garland.
 */
const RING_SPRITE_COUNTS: Record<string, number> = {
  "tegie.cigaro": 5,
  "tegie.suszone": 5,
  "miekkie.dojrzale": 9,
  "miekkie.konfitury": 5,
  "oleiste.maslo": 4,
  "oleiste.tropikalne": 6,
  "swieze.zielone": 8,
  "swieze.cytrusy": 5,
  "ziemiste.mineraly": 9,
  "ziemiste.sciolka": 7,
  "szorstkie.pizmo": 4,
  "szorstkie.dab": 5,
};

const spritesOf = (tendencjaId: string): string[] => {
  const n = RING_SPRITE_COUNTS[tendencjaId] ?? 0;
  const base = tendencjaId.replace(/\./g, "-");
  // `?v=` busts next/image's URL-keyed cache when sprites are re-cut under the
  // same filename (see src/lib/asset-version.ts).
  return Array.from(
    { length: n },
    (_, i) => `/senses/ring/${base}-${i + 1}.png?v=${SPRITE_VER}`,
  );
};

/**
 * Object sprites for a focused id, as a horizontal strip.
 *  - tendencja → ONLY its own objects. Since the 4 glued groups were
 *    re-sliced (2026-07-21) every tendencja has ≥2 real objects, so the
 *    card never mixes in a sibling's objects (client: the Warzywa card must
 *    not show citrus). The sibling-borrow fallback stays for the impossible
 *    case of a future tendencja with a single sprite.
 *  - sektor    → objects from both children, evenly taken
 *  - base      → none, matching the wheel
 */
export function ringSpritesFor(id: string, max = 5): string[] {
  if (RING_IMAGE_MAP[id]) {
    const own = spritesOf(id);
    if (own.length >= 2) return own.slice(0, max);
    const sector = id.split(".")[0];
    const sibling = Object.keys(RING_IMAGE_MAP).find(
      (k) => k !== id && k.startsWith(`${sector}.`),
    );
    const extra = sibling ? spritesOf(sibling) : [];
    return [...own, ...extra].slice(0, max);
  }
  const children = Object.keys(RING_IMAGE_MAP).filter((k) => k.startsWith(`${id}.`));
  if (children.length === 0) return [];
  // Interleave so both tendencje of a sektor are represented in the strip.
  const perChild = Math.max(1, Math.ceil(max / children.length));
  return children.flatMap((c) => spritesOf(c).slice(0, perChild)).slice(0, max);
}
