/* ============================================================
   scripts/generate-placeholders.mjs
   Gera placeholders SVG identificados para todas as imagens
   usadas em modo demonstração. Rode: node scripts/generate-placeholders.mjs
   Substitua os arquivos por fotos reais mantendo os mesmos nomes.
   ============================================================ */
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = "assets/img";
mkdirSync(`${OUT}/placeholders`, { recursive: true });
mkdirSync(`${OUT}/icons`, { recursive: true });

const GOLD = "#c8a24a";
const DARK = "#161616";
const DARKER = "#0d0d0d";
const MUTED = "#8a8578";

function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

function placeholder({ w, h, label, sub = "substituir por foto real", tone = "dark", glyph = "scissors" }) {
  const bg = tone === "gold" ? "#241d0e" : DARK;
  const fg = tone === "gold" ? GOLD : GOLD;
  const diagonal = tone === "gold"
    ? `<pattern id="p" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
         <rect width="28" height="28" fill="${bg}"/><rect width="14" height="28" fill="#2a2211"/>
       </pattern>`
    : `<pattern id="p" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
         <rect width="28" height="28" fill="${bg}"/><rect width="14" height="28" fill="#1b1b1b"/>
       </pattern>`;

  const glyphPath = glyph === "scissors"
    ? `<g stroke="${fg}" stroke-width="6" fill="none" stroke-linecap="round" transform="translate(${w / 2 - 40}, ${h / 2 - 130}) scale(3.3)">
         <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>
       </g>`
    : `<text x="50%" y="${h / 2 - 60}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.min(w, h) * 0.5}" fill="${fg}" opacity=".9" dominant-baseline="middle">${glyph}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
  <defs>${diagonal}</defs>
  <rect width="${w}" height="${h}" fill="url(#p)"/>
  <rect x="8" y="8" width="${w - 16}" height="${h - 16}" fill="none" stroke="${fg}" stroke-opacity=".35" stroke-width="2" stroke-dasharray="10 8" rx="14"/>
  ${glyphPath}
  <text x="50%" y="${h / 2 + 40}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="${Math.max(18, Math.round(w / 22))}" fill="${fg}" letter-spacing="2">${esc(label.toUpperCase())}</text>
  <text x="50%" y="${h / 2 + 78}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.max(12, Math.round(w / 40))}" fill="${MUTED}">${esc(sub)}</text>
</svg>`;
}

const jobs = [
  // hero + sobre
  { file: "placeholders/hero.svg", w: 800, h: 1000, label: "Foto principal — ambiente / cliente" },
  { file: "placeholders/about.svg", w: 800, h: 600, label: "Foto — interior da barbearia" },

  // serviços
  { file: "placeholders/service-corte.svg", w: 640, h: 400, label: "Corte tradicional" },
  { file: "placeholders/service-degrade.svg", w: 640, h: 400, label: "Corte degradê" },
  { file: "placeholders/service-combo.svg", w: 640, h: 400, label: "Corte + barba" },
  { file: "placeholders/service-barba.svg", w: 640, h: 400, label: "Barba completa" },
  { file: "placeholders/service-sobrancelha.svg", w: 640, h: 400, label: "Sobrancelha" },
  { file: "placeholders/service-pigmentacao.svg", w: 640, h: 400, label: "Pigmentação" },
  { file: "placeholders/service-platinado.svg", w: 640, h: 400, label: "Platinado" },
  { file: "placeholders/service-infantil.svg", w: 640, h: 400, label: "Corte infantil" },
  { file: "placeholders/service-terapia.svg", w: 640, h: 400, label: "Terapia capilar" },

  // barbeiros
  { file: "placeholders/barber-1.svg", w: 480, h: 480, label: "Foto — Carlos" },
  { file: "placeholders/barber-2.svg", w: 480, h: 480, label: "Foto — Rafael" },
  { file: "placeholders/barber-3.svg", w: 480, h: 480, label: "Foto — Diego" },

  // galeria
  { file: "placeholders/gallery-1.svg", w: 480, h: 480, label: "Galeria — corte" },
  { file: "placeholders/gallery-2.svg", w: 480, h: 480, label: "Galeria — barba" },
  { file: "placeholders/gallery-3.svg", w: 480, h: 480, label: "Galeria — ambiente" },
  { file: "placeholders/gallery-4.svg", w: 480, h: 480, label: "Galeria — corte" },
  { file: "placeholders/gallery-5.svg", w: 480, h: 480, label: "Galeria — transformação" },
  { file: "placeholders/gallery-6.svg", w: 480, h: 480, label: "Galeria — equipe" },

  // antes/depois (antes escuro, depois dourado p/ contraste visual)
  { file: "placeholders/ba-1-before.svg", w: 800, h: 600, label: "Antes — transformação 1", tone: "dark" },
  { file: "placeholders/ba-1-after.svg", w: 800, h: 600, label: "Depois — transformação 1", tone: "gold" },
  { file: "placeholders/ba-2-before.svg", w: 800, h: 600, label: "Antes — transformação 2", tone: "dark" },
  { file: "placeholders/ba-2-after.svg", w: 800, h: 600, label: "Depois — transformação 2", tone: "gold" },

  // avatares
  { file: "placeholders/avatar-1.svg", w: 96, h: 96, label: "L", sub: "avatar", glyph: "L" },
  { file: "placeholders/avatar-2.svg", w: 96, h: 96, label: "B", sub: "avatar", glyph: "B" },
  { file: "placeholders/avatar-3.svg", w: 96, h: 96, label: "A", sub: "avatar", glyph: "A" },
  { file: "placeholders/avatar-4.svg", w: 96, h: 96, label: "F", sub: "avatar", glyph: "F" }
];

for (const j of jobs) {
  writeFileSync(`${OUT}/${j.file}`, placeholder(j));
}

// Ícone PWA / favicon (SVG moderno aceito por manifest e browsers)
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="${DARKER}"/>
  <g stroke="${GOLD}" stroke-width="26" fill="none" stroke-linecap="round" transform="translate(136,116) scale(10)">
    <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>
  </g>
</svg>`;
writeFileSync(`${OUT}/icons/icon.svg`, icon);

console.log(`OK — ${jobs.length + 1} SVGs gerados em ${OUT}/`);
