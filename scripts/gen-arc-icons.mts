/**
 * gen-arc-icons.mts — generate the 12 transparent icon clusters that orbit
 * the Vinocompas wheel (client 16.07: "nie w okręgach tylko w takich łukach
 * lub jako wiszące ikony" — like the original poster's cut-out collages).
 *
 * One PNG per tendencja, transparent background, written to
 * public/senses/arc/<tendencja-id>.png (dots → dashes).
 *
 * Usage (needs a working OPENAI_API_KEY in the env):
 *   npx tsx scripts/gen-arc-icons.mts            # all 12
 *   npx tsx scripts/gen-arc-icons.mts tegie.cigaro swieze.cytrusy
 */

import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";

const OUT_DIR = path.join(process.cwd(), "public", "senses", "arc");

// Per-tendencja subject lists — drawn from the KB associations, phrased for
// clean isolated objects (no scene, no text).
const SUBJECTS: Record<string, string> = {
  "tegie.cigaro":
    "roasted coffee beans, a piece of dark chocolate, a cinnamon stick, a small cigar",
  "tegie.suszone":
    "dried plums (prunes), dried apricots, raisins, dates, dried orange slice",
  "miekkie.dojrzale":
    "ripe cherries, a plum, raspberries, a fig cut open, ripe strawberry",
  "miekkie.konfitury":
    "a small jar of red fruit jam, spoon of confiture, caramelized apple slice, baked strawberry",
  "oleiste.maslo":
    "a pat of butter, walnuts and hazelnuts, a golden toast slice, butter cookies",
  "oleiste.tropikalne":
    "mango half, pineapple wedge, papaya slice with seeds, lychee, banana",
  "swieze.zielone":
    "cucumber slices, green asparagus spears, celery stalk, green melon wedge, green grapes",
  "swieze.cytrusy":
    "lemon wedge, grapefruit half, orange slice, mandarin with leaf",
  "ziemiste.mineraly":
    "smooth river stones, grey flint pebbles, a seashell, a starfish, mineral crystals",
  // Canonical "Ściółka leśna" = forest floor: soil, cut grass, violets,
  // lavender (vinocompas.pl samouczek). Lavender/violets belong HERE, not in
  // szorstkie.pizmo where an earlier prompt misplaced them.
  "ziemiste.sciolka":
    "forest mushrooms, green moss, fresh violets, a sprig of lavender, cut grass, fallen autumn leaves",
  // Canonical "Piżmo, skóra" = ANIMAL/musk associations: wet dog, horse,
  // stable, leather - not botanical. (samouczek: "skojarzenia zwierzęce".)
  "szorstkie.pizmo":
    "a piece of tan leather, a worn leather saddle, animal fur, a horsehair brush, dark musk resin",
  "szorstkie.dab":
    "a small oak barrel, oak wood chips, an acorn with oak leaf, wisp of smoke",
};

const STYLE =
  "Small collage cluster of isolated photorealistic cut-out objects on a fully TRANSPARENT background: {SUBJECTS}. " +
  "Objects scattered loosely in a gentle arc arrangement, varied sizes, soft natural studio light, warm tones, " +
  "high-end culinary editorial style. Absolutely no background, no shadows on ground, no text, no border, no frame.";

async function main() {
  const only = process.argv.slice(2);
  const ids = only.length > 0 ? only : Object.keys(SUBJECTS);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");
  const openai = new OpenAI({ apiKey, timeout: 120_000 });

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const id of ids) {
    const subjects = SUBJECTS[id];
    if (!subjects) {
      console.warn(`skip unknown id: ${id}`);
      continue;
    }
    const file = path.join(OUT_DIR, `${id.replace(/\./g, "-")}.png`);
    if (fs.existsSync(file) && only.length === 0) {
      console.log(`✓ exists ${file}`);
      continue;
    }
    console.log(`… generating ${id}`);
    const res = await openai.images.generate({
      model: "gpt-image-1",
      prompt: STYLE.replace("{SUBJECTS}", subjects),
      size: "1024x1024",
      quality: "medium",
      background: "transparent",
      output_format: "png",
    });
    const b64 = res.data?.[0]?.b64_json;
    if (!b64) throw new Error(`no image for ${id}`);
    fs.writeFileSync(file, Buffer.from(b64, "base64"));
    console.log(`✓ wrote ${file} (${Math.round(Buffer.from(b64, "base64").length / 1024)} KB)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
