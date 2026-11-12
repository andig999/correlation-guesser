// Pixel-art icons from assets/icons/. The images are finished assets and are only displayed here.
// Size: native pixel size × integer factor. The factor comes from the CSS custom property
// --icon-scale (default 1), so each context and breakpoint can choose its own integer scale.

export const ICON_NAMES = Object.freeze([
  "herz-voll",
  "herz-leer",
  "herz-gebrochen",
  "muenze",
  "fahne",
  "zielscheibe",
  "pokal",
  "birne",
  "linie",
  "treppe",
  "gluehbirne",
  "schriftrolle",
  "hinweis",
  "burg",
  "pfeil",
]);

const iconImages = new Map();

function assertIcon(name) {
  if (!ICON_NAMES.includes(name)) {
    throw new RangeError(`Unbekanntes Icon: ${name}`);
  }
}

export function iconUrl(name) {
  assertIcon(name);
  return `./assets/icons/${name}.png`;
}

function loadIcon(name) {
  if (iconImages.has(name)) return iconImages.get(name);
  const pending = new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Icon konnte nicht geladen werden: ${image.src}`));
    image.src = iconUrl(name);
  });
  iconImages.set(name, pending);
  return pending;
}

export function preloadIcons() {
  return Promise.all(ICON_NAMES.map(loadIcon));
}

// Returns an <img class="pixel-icon">. Width and height are set as CSS variables
// (--icon-w, --icon-h) once the image is loaded; CSS multiplies them by --icon-scale.
export function createIcon(name, { className = "", label = "" } = {}) {
  assertIcon(name);
  const image = document.createElement("img");
  image.className = `pixel-icon${className ? ` ${className}` : ""}`;
  image.src = iconUrl(name);
  image.alt = label;
  if (!label) image.setAttribute("aria-hidden", "true");
  image.draggable = false;
  image.dataset.icon = name;
  loadIcon(name)
    .then((source) => {
      image.style.setProperty("--icon-w", String(source.naturalWidth));
      image.style.setProperty("--icon-h", String(source.naturalHeight));
    })
    .catch(() => {
      image.hidden = true;
    });
  return image;
}

// Puts an icon in front of the text of an element, e.g. a button.
export function setIconLabel(element, iconName, text) {
  const icon = createIcon(iconName);
  const label = document.createElement("span");
  label.textContent = text;
  element.replaceChildren(icon, label);
  element.classList.add("has-icon");
}
