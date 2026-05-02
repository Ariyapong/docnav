import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const svgPath = join(root, "public/icons/icon.svg");
const outDir = join(root, "public/icons");
const sizes = [16, 32, 48, 128];

const svg = await readFile(svgPath);
await Promise.all(
  sizes.map(async (size) => {
    const out = join(outDir, `icon-${size}.png`);
    await sharp(svg, { density: Math.max(72, size * 2) })
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(out);
    console.log(`✓ ${out}`);
  }),
);
