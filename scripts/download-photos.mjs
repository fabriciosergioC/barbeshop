/* ============================================================
   scripts/download-photos.mjs
   Baixa fotos reais (licença Unsplash) para substituir os
   placeholders SVG em modo demonstração.

   Rode: node scripts/download-photos.mjs
   Saída: assets/img/photos/*.webp (+ og-image.jpg)

   - Cada slot tem uma lista de foto-IDs candidatos; o script
     tenta em ordem até baixar uma imagem válida.
   - Valida: HTTP 200, magic bytes (WebP/JPEG) e tamanho mínimo.
   - Nomes de arquivo = mesmos dos placeholders (extensão .webp),
     então basta trocar o diretório no demoData.js/index.html.
   - Para trocar por fotos reais do negócio: basta salvar as
     fotos em assets/img/photos/ com os MESMOS nomes de arquivo.
   ============================================================ */
import { mkdirSync, writeFileSync, existsSync, statSync } from "node:fs";

const OUT = "assets/img/photos";
const MIN_BYTES = 4 * 1024; // < 4 KB = provavelmente erro/blank

// ---- Slots: arquivo -> candidatos Unsplash (ordem = prioridade) ----
// Tema: barbearia (corte, barba, ambiente, equipe) — nada aleatório.
// IDs marcados com "✓" foram conferidos visualmente (veja README/créditos).
const SLOTS = [
  // Serviços (cards 16:10)
  { file: "service-corte.webp",      w: 800, h: 500, ids: ["photo-1567894340315-735d7c361db0", "photo-1503951914875-452162b0f3f1"] },
  { file: "service-degrade.webp",    w: 800, h: 500, ids: ["photo-1599351431202-1e0f0137899a", "photo-1503951914875-452162b0f3f1"] },
  { file: "service-combo.webp",      w: 800, h: 500, ids: ["photo-1503951914875-452162b0f3f1", "photo-1605497788044-5a32c7078486"] },
  // ⚠ service-barba: arquivo atual = FOTO DO USUÁRIO (barba modelada).
  { file: "service-barba.webp",      w: 800, h: 500, ids: ["photo-1605497788044-5a32c7078486", "photo-1567894340315-735d7c361db0"] },
  // ⚠ service-sobrancelha: arquivo atual = FOTO DO USUÁRIO (design de sobrancelha).
  { file: "service-sobrancelha.webp",w: 800, h: 500, ids: ["photo-1622286342621-4bd786c2447c", "photo-1567894340315-735d7c361db0"] },
  // ⚠ service-pigmentacao: arquivo atual = FOTO DO USUÁRIO (pigmentação na barba).
  { file: "service-pigmentacao.webp",w: 800, h: 500, ids: ["photo-1621605815971-fbc98d665033", "photo-1541532713592-79a0317b6b77"] },
  // ⚠ platinado: arquivo atual = FOTO DO USUÁRIO (corte platinado real).
  // IDs abaixo são apenas fallback se o arquivo for apagado.
  { file: "service-platinado.webp",  w: 800, h: 500, ids: ["photo-1600948836101-f9ffda59d250", "photo-1562322140-8baeececf3df"] },
  // ⚠ service-infantil: arquivo atual = FOTO DO USUÁRIO (degradê com risco infantil).
  { file: "service-infantil.webp",   w: 800, h: 500, ids: ["photo-1519238263530-99bdd11df2ea", "photo-1602233158242-3ba0ac4d2167"] },
  // ⚠ service-terapia: arquivo atual = FOTO DO USUÁRIO (lavagem no lavatório).
  { file: "service-terapia.webp",    w: 800, h: 500, ids: ["photo-1570172619644-dfd03ed5d881", "photo-1526947425960-945c6e72858f"] },

  // Barbeiros (retratos 1:1)
  { file: "barber-1.webp", w: 800, h: 800, ids: ["photo-1568602471122-7832951cc4c5", "photo-1507003211169-0a1dd7228f2d"] },
  { file: "barber-2.webp", w: 800, h: 800, ids: ["photo-1500648767791-00dcc994a43e", "photo-1531427186611-ecfd6d936c79"] },
  { file: "barber-3.webp", w: 800, h: 800, ids: ["photo-1507003211169-0a1dd7228f2d", "photo-1500648767791-00dcc994a43e"] },

  // Galeria (1:1)
  { file: "gallery-1.webp", w: 800, h: 800, ids: ["photo-1504593811423-6dd665756598", "photo-1519085360753-af0119f7cbe7"] },
  { file: "gallery-2.webp", w: 800, h: 800, ids: ["photo-1517832606299-7ae9b720a186", "photo-1542909168-82c3e7fdca5c"] },
  { file: "gallery-3.webp", w: 800, h: 800, ids: ["photo-1585747860715-2ba37e788b70", "photo-1600948836101-f9ffda59d250"] },
  { file: "gallery-4.webp", w: 800, h: 800, ids: ["photo-1519085360753-af0119f7cbe7", "photo-1547425260-76bcadfb4f2c"] },
  // ⚠ gallery-5: arquivo atual = FOTO DO USUÁRIO (corte platinado real).
  { file: "gallery-5.webp", w: 800, h: 800, ids: ["photo-1492106087820-71f1a00d2b11", "photo-1596815064285-45ed8a9c0463"] },
  // gallery-6 ("A equipe") = cópia da foto real do negócio (placeholders/barbearia.jpg)
  // feita manualmente como assets/img/photos/gallery-6.jpg.

  // Antes/Depois (4:3)
  { file: "ba-1-before.webp", w: 1200, h: 900, ids: ["photo-1506794778202-cad84cf45f1d", "photo-1521119989659-a83eee488004"] },
  // ⚠ ba-1-after: arquivo atual = FOTO DO USUÁRIO (corte platinado real).
  { file: "ba-1-after.webp",  w: 1200, h: 900, ids: ["photo-1600486913747-55e5470d6f40", "photo-1492106087820-71f1a00d2b11"] },
  // ⚠ ba-2-before: arquivo atual = FOTO DO USUÁRIO (metade esquerda da montagem antes/depois).
  { file: "ba-2-before.webp", w: 1200, h: 900, ids: ["photo-1521119989659-a83eee488004", "photo-1506794778202-cad84cf45f1d"] },
  // ⚠ ba-2-after: arquivo atual = FOTO DO USUÁRIO (metade direita da montagem antes/depois).
  { file: "ba-2-after.webp",  w: 1200, h: 900, ids: ["photo-1547425260-76bcadfb4f2c", "photo-1568602471122-7832951cc4c5"] },

  // Avatares de avaliações (44px na tela)
  { file: "avatar-1.webp", w: 160, h: 160, ids: ["photo-1472099645785-5658abf4ff4e", "photo-1504593811423-6dd665756598"] },
  { file: "avatar-2.webp", w: 160, h: 160, ids: ["photo-1531427186611-ecfd6d936c79", "photo-1513956589380-bad6acb9b9d4"] },
  { file: "avatar-3.webp", w: 160, h: 160, ids: ["photo-1492562080023-ab3db95bfbce", "photo-1522075469751-3a6694fb2f61"] },
  { file: "avatar-4.webp", w: 160, h: 160, ids: ["photo-1463453091185-61582044d556", "photo-1508341591423-4347099e1f19"] },

  // Open Graph (compartilhamento social) — JPG p/ máxima compatibilidade
  { file: "og-image.jpg", w: 1200, h: 630, fm: "jpg", ids: ["photo-1585747860715-2ba37e788b70", "photo-1503951914875-452162b0f3f1"] },
];

const unsplashUrl = (id, s) =>
  `https://images.unsplash.com/${id}?fm=${s.fm || "webp"}&q=80&fit=crop&w=${s.w}&h=${s.h}`;

function isWebp(buf) {
  return buf.length > 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP";
}
function isJpeg(buf) {
  return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

async function tryDownload(id, slot) {
  const url = unsplashUrl(id, slot);
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < MIN_BYTES) throw new Error(`muito pequeno (${buf.length} B)`);
    const ok = slot.fm === "jpg" ? isJpeg(buf) : isWebp(buf);
    if (!ok) throw new Error("magic bytes inválidos (não é " + (slot.fm || "webp") + ")");
    return { buf, url, bytes: buf.length };
  } catch (e) {
    console.warn(`  ✗ ${id}: ${e.message}`);
    return null;
  }
}

mkdirSync(OUT, { recursive: true });

// Preserva créditos de arquivos já existentes (ex.: fotos do usuário)
// mesmo quando o slot é pulado no re-download.
const CREDITS_FILE = "scripts/photo-credits.json";
const credits = existsSync(CREDITS_FILE)
  ? JSON.parse((await import("node:fs")).readFileSync(CREDITS_FILE, "utf8"))
  : {};
const used = new Map(); // id -> arquivo (aviso de duplicação)
let failures = 0;

for (const slot of SLOTS) {
  const dest = `${OUT}/${slot.file}`;
  if (existsSync(dest) && statSync(dest).size > MIN_BYTES) {
    console.log(`• ${slot.file}: já existe — pulando (apague para rebaixar)`);
    continue;
  }
  let done = false;
  for (const id of slot.ids) {
    const r = await tryDownload(id, slot);
    if (!r) continue;
    writeFileSync(dest, r.buf);
    credits[slot.file] = { id, url: r.url, bytes: r.bytes };
    if (used.has(id)) console.warn(`  ⚠ mesmo ID usado também em ${used.get(id)}`);
    used.set(id, slot.file);
    console.log(`✓ ${slot.file} ← ${id} (${(r.bytes / 1024).toFixed(0)} KB)`);
    done = true;
    break;
  }
  if (!done) { console.error(`✗✗ FALHOU: ${slot.file} (nenhum candidato válido)`); failures++; }
}

writeFileSync("scripts/photo-credits.json", JSON.stringify(credits, null, 2) + "\n");
console.log(`\n${SLOTS.length - failures}/${SLOTS.length} imagens prontas em ${OUT}/`);
console.log("Créditos: scripts/photo-credits.json");
process.exit(failures ? 1 : 0);
