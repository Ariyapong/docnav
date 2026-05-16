import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const srcPath = join(root, "public/icons/icon-source.png");
const outDir = join(root, "public/icons");
const sizes = [16, 32, 48, 128];

await Promise.all(
  sizes.map(async (size) => {
    const out = join(outDir, `icon-${size}.png`);
    await sharp(srcPath)
      .resize(size, size, {
        fit: "contain",
        kernel: "lanczos3",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 9 })
      .toFile(out);
    console.log(`✓ ${out}`);
  }),
);
