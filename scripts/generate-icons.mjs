/**
 * Generate PWA icons untuk HASSINA PKL
 * Run: node scripts/generate-icons.mjs
 */

import sharp from "sharp";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, "../public/icons");

mkdirSync(iconsDir, { recursive: true });

// SVG icon — PKL briefcase logo dengan warna HASSINA biru
const svgTemplate = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#2563EB"/>
  <!-- Briefcase body -->
  <rect x="${size*0.15}" y="${size*0.35}" width="${size*0.7}" height="${size*0.5}" rx="${size*0.08}" fill="white" opacity="0.95"/>
  <!-- Briefcase handle -->
  <path d="M${size*0.35} ${size*0.35} L${size*0.35} ${size*0.27} C${size*0.35} ${size*0.2} ${size*0.65} ${size*0.2} ${size*0.65} ${size*0.27} L${size*0.65} ${size*0.35}" 
        stroke="white" stroke-width="${size*0.055}" fill="none" stroke-linecap="round" opacity="0.8"/>
  <!-- Center line -->
  <rect x="${size*0.15}" y="${size*0.55}" width="${size*0.7}" height="${size*0.04}" fill="#2563EB" opacity="0.15"/>
  <!-- Center dot -->
  <circle cx="${size*0.5}" cy="${size*0.575}" r="${size*0.06}" fill="#2563EB" opacity="0.9"/>
</svg>
`;

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function generate() {
  console.log("🎨 Generating PWA icons...");

  for (const size of SIZES) {
    const svg = Buffer.from(svgTemplate(size));
    const outPath = join(iconsDir, `icon-${size}x${size}.png`);
    await sharp(svg).png().toFile(outPath);
    console.log(`  ✓ icon-${size}x${size}.png`);
  }

  // Apple touch icon (180x180)
  const svg180 = Buffer.from(svgTemplate(180));
  await sharp(svg180).png().toFile(join(iconsDir, "apple-touch-icon.png"));
  console.log("  ✓ apple-touch-icon.png");

  // Favicon (32x32)
  const svg32 = Buffer.from(svgTemplate(32));
  await sharp(svg32).png().toFile(join(iconsDir, "favicon-32x32.png"));
  console.log("  ✓ favicon-32x32.png");

  // Shortcut icons — pakai warna berbeda
  const shortcutSvg = (emoji, bg, size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${bg}"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="${size * 0.55}" font-family="system-ui">${emoji}</text>
</svg>`;

  const shortcuts = [
    { name: "shortcut-presensi", emoji: "📷", bg: "#059669" },
    { name: "shortcut-jurnal",   emoji: "📓", bg: "#7C3AED" },
    { name: "shortcut-pengumuman", emoji: "📢", bg: "#EA580C" },
  ];

  for (const sc of shortcuts) {
    const svg = Buffer.from(shortcutSvg(sc.emoji, sc.bg, 96));
    await sharp(svg).png().toFile(join(iconsDir, `${sc.name}.png`));
    console.log(`  ✓ ${sc.name}.png`);
  }

  // Splash screens — solid color + logo centered (simplified)
  const splashSizes = [
    { w: 640,  h: 1136, name: "splash-640x1136" },
    { w: 750,  h: 1334, name: "splash-750x1334" },
    { w: 1125, h: 2436, name: "splash-1125x2436" },
    { w: 1242, h: 2208, name: "splash-1242x2208" },
    { w: 1536, h: 2048, name: "splash-1536x2048" },
    { w: 1668, h: 2224, name: "splash-1668x2224" },
    { w: 2048, h: 2732, name: "splash-2048x2732" },
  ];

  for (const sp of splashSizes) {
    const iconSize = Math.round(sp.w * 0.25);
    const iconX = Math.round((sp.w - iconSize) / 2);
    const iconY = Math.round((sp.h - iconSize) / 2) - Math.round(sp.h * 0.05);
    const textY = iconY + iconSize + Math.round(sp.h * 0.04);
    const fontSize = Math.round(sp.w * 0.055);
    const subFontSize = Math.round(sp.w * 0.03);

    const splashSvg = `
<svg width="${sp.w}" height="${sp.h}" viewBox="0 0 ${sp.w} ${sp.h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${sp.w}" height="${sp.h}" fill="#2563EB"/>
  <!-- Decorative circles -->
  <circle cx="${sp.w * 0.85}" cy="${sp.h * 0.1}" r="${sp.w * 0.35}" fill="white" opacity="0.05"/>
  <circle cx="${sp.w * 0.1}" cy="${sp.h * 0.9}" r="${sp.w * 0.3}" fill="white" opacity="0.05"/>
  <!-- App icon -->
  <rect x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" rx="${iconSize * 0.22}" fill="white" opacity="0.15"/>
  <rect x="${iconX + iconSize*0.1}" y="${iconY + iconSize*0.35}" width="${iconSize*0.8}" height="${iconSize*0.5}" rx="${iconSize*0.1}" fill="white" opacity="0.95"/>
  <path d="M${iconX+iconSize*0.3} ${iconY+iconSize*0.35} L${iconX+iconSize*0.3} ${iconY+iconSize*0.25} C${iconX+iconSize*0.3} ${iconY+iconSize*0.15} ${iconX+iconSize*0.7} ${iconY+iconSize*0.15} ${iconX+iconSize*0.7} ${iconY+iconSize*0.25} L${iconX+iconSize*0.7} ${iconY+iconSize*0.35}" 
        stroke="white" stroke-width="${iconSize*0.07}" fill="none" stroke-linecap="round" opacity="0.8"/>
  <!-- App name -->
  <text x="${sp.w/2}" y="${textY}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" 
        font-size="${fontSize}" font-weight="800" fill="white">PKL SMK HASSINA</text>
  <text x="${sp.w/2}" y="${textY + fontSize * 1.4}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" 
        font-size="${subFontSize}" fill="rgba(255,255,255,0.7)">Praktek Kerja Industri</text>
</svg>`;

    await sharp(Buffer.from(splashSvg)).png().toFile(join(iconsDir, `${sp.name}.png`));
    console.log(`  ✓ ${sp.name}.png`);
  }

  // Screenshots folder
  const screenshotsDir = join(__dirname, "../public/screenshots");
  mkdirSync(screenshotsDir, { recursive: true });

  // Placeholder screenshots (biru dengan teks)
  for (const sc of [
    { name: "dashboard-mobile", label: "Dashboard PKL" },
    { name: "presensi-mobile",  label: "Presensi Digital" },
  ]) {
    const scSvg = `
<svg width="390" height="844" viewBox="0 0 390 844" xmlns="http://www.w3.org/2000/svg">
  <rect width="390" height="844" fill="#F8FAFC"/>
  <rect width="390" height="64" fill="#2563EB"/>
  <text x="195" y="38" text-anchor="middle" font-family="system-ui" font-size="18" font-weight="700" fill="white">${sc.label}</text>
  <rect x="16" y="80" width="358" height="120" rx="16" fill="#EFF6FF"/>
  <rect x="16" y="216" width="172" height="80" rx="12" fill="white" stroke="#E2E8F0"/>
  <rect x="202" y="216" width="172" height="80" rx="12" fill="white" stroke="#E2E8F0"/>
  <rect x="16" y="312" width="358" height="64" rx="12" fill="white" stroke="#E2E8F0"/>
  <rect x="16" y="392" width="358" height="64" rx="12" fill="white" stroke="#E2E8F0"/>
  <rect x="16" y="472" width="358" height="64" rx="12" fill="white" stroke="#E2E8F0"/>
  <rect width="390" height="72" y="772" fill="white" stroke="#E2E8F0"/>
  <text x="195" y="420" text-anchor="middle" font-family="system-ui" font-size="14" fill="#94A3B8">PKL SMK HASSINA</text>
</svg>`;
    await sharp(Buffer.from(scSvg)).png().toFile(join(screenshotsDir, `${sc.name}.png`));
    console.log(`  ✓ screenshots/${sc.name}.png`);
  }

  console.log("\n✅ Semua icon berhasil digenerate!");
}

generate().catch(console.error);
