const COLORS = Object.freeze({
  R: "#b4232f",
  D: "#68232b",
  P: "#f6a8a6",
  G: "#416b38",
  B: "#5b3927",
  Y: "#efb83f",
  L: "#ffe59a",
  T: "#f4d8a0",
  W: "#fff2cc",
});

export const HUD_SPRITES = Object.freeze({
  vollesHerz: Object.freeze([
    "....RRR..RRR....",
    "...RRRRRRRRRR...",
    "..RRRRRRRRRRRR..",
    "..RRRRRRRRRRRR..",
    "...RRRRRRRRRR...",
    "....RRRRRRRR....",
    ".....RRRRRR.....",
    "......RRRR......",
    ".......RR.......",
    "........R.......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
  ]),
  leererHerzSlot: Object.freeze([
    "....DD...DD.....",
    "...D...D...D....",
    "..D.....D...D...",
    "..D.........D...",
    "...D.......D....",
    "....D.....D.....",
    ".....D...D......",
    "......D.D.......",
    ".......D........",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
  ]),
  zerbrochenesHerz: Object.freeze([
    "....RRR..RRR....",
    "...RRRRRRRRRR...",
    "..RRRRDRRRRRRR..",
    "..RRRRD.RRRRRR..",
    "...RRR.DRRRRR...",
    "....RR.DRRRR....",
    ".....R.DRRR.....",
    "......RDD.......",
    ".......RD.......",
    "........D.......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
  ]),
  muenze: Object.freeze([
    "......DDDD......",
    "....DDYYYYDD....",
    "...DYYYYYYYYD...",
    "..DYYYYYYYYYYD..",
    "..DYYLYYYYYYYD..",
    ".DYYLLYYYYYYYD..",
    ".DYYLLYYYYYYYD..",
    ".DYYLLYYYYYYYD..",
    ".DYYLLYYYYYYYD..",
    ".DYYLLYYYYYYYD..",
    "..DYYLYYYYYYD...",
    "..DYYYYYYYYYD...",
    "...DYYYYYYYYD...",
    "....DDYYYYDD....",
    "......DDDD......",
    "................",
  ]),
  fahne: Object.freeze([
    "......BDD.......",
    "......BDBBBBB...",
    "......BBYBYYB...",
    "......BYYYBBB...",
    "......BBBBB.....",
    "......B.........",
    "......B.........",
    "......B.........",
    "......B.........",
    "......B.........",
    "......B.........",
    "......B.........",
    ".....BBB........",
    "....BBBBB.......",
    "................",
    "................",
  ]),
  zielscheibe: Object.freeze([
    ".....DDDDDD.....",
    "...DDYYYYYYDD...",
    "..DYYGGGGGGYYD..",
    ".DYYGG....GGYYD.",
    ".DYGG..DD..GGYD.",
    "DYYG..DYYD..GYYD",
    "DYGG.DYYYYD.GGYD",
    "DYGG.DYYYYD.GGYD",
    "DYGG.DYYYYD.GGYD",
    "DYYG..DYYD..GYYD",
    ".DYGG..DD..GGYD.",
    ".DYYGG....GGYYD.",
    "..DYYGGGGGGYYD..",
    "...DDYYYYYYDD...",
    ".....DDDDDD.....",
    "................",
  ]),
});

function escapeAttribute(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  })[character]);
}

export function rasterToSvg(raster, palette = COLORS, scale = 1) {
  if (!Array.isArray(raster) || raster.length !== 16
    || raster.some((row) => typeof row !== "string" || row.length !== 16)) {
    throw new TypeError("Ein HUD-Raster muss aus genau 16 Zeilen mit je 16 Zeichen bestehen.");
  }
  if (!Number.isInteger(scale) || scale < 1) {
    throw new RangeError("Der SVG-Skalierungsfaktor muss eine positive ganze Zahl sein.");
  }

  const rectangles = [];
  raster.forEach((row, y) => {
    [...row].forEach((character, x) => {
      if (character === ".") return;
      if (!Object.prototype.hasOwnProperty.call(palette, character)) {
        throw new RangeError(`Keine Farbe für Rasterzeichen "${character}" definiert.`);
      }
      rectangles.push(
        `<rect x="${x}" y="${y}" width="1" height="1" fill="${escapeAttribute(palette[character])}"/>`,
      );
    });
  });

  const size = 16 * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">${rectangles.join("")}</svg>`;
}

export function renderHudIcon(name, scale = 1) {
  if (!Object.prototype.hasOwnProperty.call(HUD_SPRITES, name)) {
    throw new RangeError(`Unbekanntes HUD-Symbol: ${name}`);
  }
  return rasterToSvg(HUD_SPRITES[name], COLORS, scale);
}