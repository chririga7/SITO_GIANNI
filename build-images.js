const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const BASE = __dirname;
const OUT_GALLERY = path.join(BASE, "assets", "optimized");
const OUT_PRODUCTS = path.join(BASE, "assets", "optimized", "prodotti");

fs.mkdirSync(OUT_GALLERY, { recursive: true });
fs.mkdirSync(OUT_PRODUCTS, { recursive: true });

async function optimizeFile(src, dest, maxSize) {
  const name = path.basename(src, path.extname(src)) + ".webp";
  const outPath = path.join(dest, name);
  try {
    await sharp(src)
      .resize({ width: maxSize, height: maxSize, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outPath);
    const srcStat = fs.statSync(src);
    const outStat = fs.statSync(outPath);
    const pct = ((1 - outStat.size / srcStat.size) * 100).toFixed(0);
    console.log(`  ${path.basename(src)} → ${name}  (${(srcStat.size/1024).toFixed(0)}KB → ${(outStat.size/1024).toFixed(0)}KB, -${pct}%)`);
  } catch (e) {
    console.error(`  ERROR: ${path.basename(src)}: ${e.message}`);
  }
}

async function run() {
  console.log("\n=== Gallery images (max 1600px) ===");
  const galleryDir = path.join(BASE, "assets");
  const galleryFiles = fs.readdirSync(galleryDir)
    .filter(f => /^(gallery-\d+|negozio-hero)\.jpe?g$/i.test(f))
    .map(f => path.join(galleryDir, f));

  for (const f of galleryFiles) {
    await optimizeFile(f, OUT_GALLERY, 1600);
  }

  console.log("\n=== Product images (max 600px) ===");
  const prodDir = path.join(BASE, "assets", "Immagini_HD", "Prodotti");
  const prodFiles = fs.readdirSync(prodDir)
    .filter(f => /\.(jpe?g|png)$/i.test(f))
    .filter(f => !f.startsWith("WhatsApp"))
    .map(f => path.join(prodDir, f));

  for (const f of prodFiles) {
    await optimizeFile(f, OUT_PRODUCTS, 600);
  }

  console.log("\nDone!\n");
}

run();
