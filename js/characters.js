export const CHARACTER_NAMES = ["pearson", "spearman", "regression"];
export const CHARACTER_POSES = ["ruhe", "zeigen", "jubel", "enttaeuscht"];

const CHARACTER_LABELS = {
  pearson: "Pear-son",
  spearman: "Spear-man",
  regression: "Regression",
};

const characterImages = new Map();

function assertCharacter(character) {
  if (!CHARACTER_NAMES.includes(character)) {
    throw new RangeError(`Unbekannte Figur: ${character}`);
  }
}

function assertPose(pose) {
  if (!CHARACTER_POSES.includes(pose)) {
    throw new RangeError(`Unbekannte Pose: ${pose}`);
  }
}

function preloadCharacter(character) {
  if (characterImages.has(character)) {
    return characterImages.get(character);
  }

  const pending = Promise.all(CHARACTER_POSES.map((pose) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve([pose, image]);
    image.onerror = () => reject(new Error(`Figurenbild konnte nicht geladen werden: ${image.src}`));
    image.src = `./assets/sprites/${character}-${pose}.png`;
  }))).then((entries) => new Map(entries));
  characterImages.set(character, pending);
  return pending;
}

function setImageSize(image, source, scale) {
  image.width = source.naturalWidth * scale;
  image.height = source.naturalHeight * scale;
  image.style.width = `${source.naturalWidth * scale}px`;
  image.style.height = `${source.naturalHeight * scale}px`;
}

export function createCharacterSprite(character, { pose = "ruhe", scale = 2, className = "" } = {}) {
  assertCharacter(character);
  assertPose(pose);
  if (!Number.isInteger(scale) || scale < 1) {
    throw new RangeError("Der Skalierungsfaktor muss eine positive ganze Zahl sein.");
  }

  const element = document.createElement("div");
  element.className = `character-frame${className ? ` ${className}` : ""}`;
  element.dataset.character = character;

  const image = document.createElement("img");
  image.className = "character-image";
  image.alt = `${CHARACTER_LABELS[character]} – ${pose}`;
  image.draggable = false;
  element.append(image);

  let requestNumber = 0;
  let hopTimer;
  const imagesReady = preloadCharacter(character);

  function setPose(nextPose) {
    assertPose(nextPose);
    requestNumber += 1;
    const request = requestNumber;

    if (hopTimer) {
      clearTimeout(hopTimer);
      hopTimer = undefined;
    }
    element.classList.remove("huepfen");
    element.classList.toggle("wippen", nextPose === "ruhe");

    if (nextPose === "jubel") {
      element.classList.add("huepfen");
      hopTimer = setTimeout(() => {
        element.classList.remove("huepfen");
        hopTimer = undefined;
      }, 600);
    }

    return imagesReady.then((images) => {
      if (request !== requestNumber) return;

      const selectedImage = images.get(nextPose);
      image.src = selectedImage.src;
      image.alt = `${CHARACTER_LABELS[character]} – ${nextPose}`;
      setImageSize(image, selectedImage, scale);

      const frameWidth = Math.max(...[...images.values()].map((item) => item.naturalWidth)) * scale;
      const frameHeight = Math.max(...[...images.values()].map((item) => item.naturalHeight)) * scale;
      element.style.width = `${frameWidth}px`;
      element.style.height = `${frameHeight}px`;
    });
  }

  const ready = setPose(pose);
  return { element, image, ready, setPose };
}
