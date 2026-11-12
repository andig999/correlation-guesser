import {
  advanceRound,
  createGameState,
  resolveRound,
  startRound,
} from "./game.js";
import { createScenario } from "./scenarios.js";
import {
  colorizeGroups,
  drawGroupRegressionLines,
  drawRegressionLine,
  markOutlier,
  renderPlot,
} from "./plot.js";
import { CHARACTER_NAMES, createCharacterSprite } from "./characters.js";
import { createRng } from "./rng.js";
import { createIcon, preloadIcons, setIconLabel } from "./icons.js";
import { pearson } from "./stats.js";
import { APP_TITLE, explanationFor, TEXTS } from "./texts.js";

const HIGH_SCORE_KEY = "correlation-guesser-highscore";
const root = document.querySelector("#app");
if (!root) {
  throw new Error("The game container #app is missing.");
}

document.title = APP_TITLE;
document.querySelector("#app-title").textContent = APP_TITLE;
document.querySelector("#start-highscore-label").textContent = TEXTS.highscore;
document.querySelector("#start-button").textContent = TEXTS.startGame;
document.querySelector("#rules-button").textContent = TEXTS.gameRules;
document.querySelector("#rules-title").textContent = TEXTS.rulesTitle;
document.querySelector("#rules-start").textContent = TEXTS.rulesStart;
document.querySelector("#rules-perfect").textContent = TEXTS.rulesPerfect;
document.querySelector("#rules-close").textContent = TEXTS.rulesClose;
document.querySelector("#rules-miss").textContent = TEXTS.rulesMiss;
document.querySelector("#lives-label").textContent = TEXTS.lives;
document.querySelector("#coins-label").textContent = TEXTS.coins;
document.querySelector("#round-label").textContent = TEXTS.round;
document.querySelector("#average-error-label").textContent = TEXTS.averageError;
document.querySelector("#average-error-value").setAttribute("aria-label", TEXTS.averageErrorAccessible);
document.querySelector("#guess-label").textContent = TEXTS.guessLabel;
document.querySelector("#guess-input").setAttribute("aria-label", TEXTS.numberInputLabel);
document.querySelector("#submit-guess").textContent = TEXTS.submitGuess;
setIconLabel(document.querySelector("#menu-button"), "burg", TEXTS.menu);
document.querySelector("#menu-confirmation-text").textContent = TEXTS.abandonPrompt;
document.querySelector("#menu-confirm-yes").textContent = TEXTS.yes;
document.querySelector("#menu-confirm-no").textContent = TEXTS.no;
document.querySelector("#resolution-title").textContent = TEXTS.resolutionTitle;
document.querySelector("#game-over-title").textContent = TEXTS.gameOverTitle;
document.querySelector("#game-over-message").textContent = TEXTS.gameOverMessage;
document.querySelector("#game-over-coins-label").textContent = TEXTS.gameOverCoins;
document.querySelector("#highscore-label").textContent = TEXTS.highscore;
document.querySelector("#new-game-button").textContent = TEXTS.newGame;
setIconLabel(document.querySelector("#main-menu-button"), "burg", TEXTS.mainMenu);
setIconLabel(document.querySelector("#continue-button"), "pfeil", TEXTS.continue);

const elements = {
  startScreen: document.querySelector("#start-screen"),
  gameScreen: document.querySelector("#game-screen"),
  gameOverScreen: document.querySelector("#game-over"),
  menuCharacters: document.querySelector("#menu-characters"),
  menuStatus: document.querySelector("#menu-status"),
  endCharacters: document.querySelector("#end-characters"),
  startHighscore: document.querySelector("#start-highscore-value"),
  startStorageNotice: document.querySelector("#start-storage-notice"),
  startButton: document.querySelector("#start-button"),
  rulesButton: document.querySelector("#rules-button"),
  menuButton: document.querySelector("#menu-button"),
  menuConfirmation: document.querySelector("#menu-confirmation"),
  menuConfirmYes: document.querySelector("#menu-confirm-yes"),
  menuConfirmNo: document.querySelector("#menu-confirm-no"),
  rulesCard: document.querySelector("#rules-card"),
  prompt: document.querySelector("#round-prompt"),
  promptBoard: document.querySelector("#prompt-board"),
  promptTitle: document.querySelector("#round-prompt-title"),
  promptCaption: document.querySelector("#round-prompt-caption"),
  roundCharacter: document.querySelector("#round-character"),
  lives: document.querySelector("#lives-value"),
  coins: document.querySelector("#coins-value"),
  roundCount: document.querySelector("#round-count"),
  averageErrorDisplay: document.querySelector("#average-error-display"),
  storageNotice: document.querySelector("#storage-notice"),
  plot: document.querySelector("#plot"),
  form: document.querySelector("#guess-form"),
  slider: document.querySelector("#guess-slider"),
  input: document.querySelector("#guess-input"),
  inputError: document.querySelector("#input-error"),
  resolution: document.querySelector("#resolution"),
  resolutionTitle: document.querySelector("#resolution-title"),
  resolutionRound: document.querySelector("#resolution-round"),
  coefficients: document.querySelector("#coefficients"),
  guessResult: document.querySelector("#guess-result"),
  roundReward: document.querySelector("#round-reward"),
  explanation: document.querySelector("#scenario-explanation"),
  regression: document.querySelector("#regression-slope"),
  groupResults: document.querySelector("#group-results"),
  continueButton: document.querySelector("#continue-button"),
  gameOverCoins: document.querySelector("#game-over-coins"),
  gameOverMessage: document.querySelector("#game-over-message"),
  highscore: document.querySelector("#highscore-value"),
  newGameButton: document.querySelector("#new-game-button"),
  mainMenuButton: document.querySelector("#main-menu-button"),
};

document.querySelectorAll("[data-icon]").forEach((element) => {
  element.replaceChildren(createIcon(element.dataset.icon));
});
preloadIcons().catch((error) => {
  elements.menuStatus.textContent = error.message;
});

const menuCharacters = new Map();
const MENU_CHARACTER_ORDER = ["pearson", "regression", "spearman"];
for (const character of MENU_CHARACTER_ORDER) {
  const item = document.createElement("div");
  item.className = "menu-character";
  item.setAttribute("aria-label", TEXTS.characterNames[character]);
  const sprite = createCharacterSprite(character, {
    scale: window.innerWidth >= 900 ? 3 : 2,
    // Spear-Man steht ganz rechts und blickt gespiegelt zur Mitte (SPEC Abschnitt 10, „Hauptmenü“).
    className: character === "spearman" ? "mirrored" : "",
  });
  const label = document.createElement("span");
  label.className = "menu-character-name";
  label.textContent = TEXTS.characterNames[character];
  item.append(sprite.element, label);
  elements.menuCharacters.append(item);
  menuCharacters.set(character, sprite);
}

window.addEventListener("resize", () => {
  const scale = window.innerWidth >= 900 ? 3 : 2;
  Promise.all([...menuCharacters.values()].map((sprite) => sprite.setScale(scale)))
    .catch((error) => {
      elements.menuStatus.textContent = TEXTS.charactersLoadError(error.message);
    });
});

let roundCharacter;
let highscoreBeatenThisGame = false;
let heartAnimationTimer;
let coinAnimationTimer;
let coinAnimationGeneration = 0;
const menuButtons = [
  document.querySelector("#start-button"),
  document.querySelector("#rules-button"),
];
menuButtons.forEach((button) => {
  button.disabled = true;
});
elements.menuStatus.textContent = TEXTS.charactersLoading;
Promise.all([...menuCharacters.values()].map((sprite) => sprite.ready))
  .then(() => {
    elements.menuStatus.textContent = "";
    menuButtons.forEach((button) => {
      button.disabled = false;
    });
    greetMenu();
  })
  .catch((error) => {
    elements.menuStatus.textContent = TEXTS.charactersLoadError(error.message);
  });

// Einzelne Posen werden im Hauptmenü ersetzt (SPEC Abschnitt 10, „Hauptmenü“):
// Spear-Mans Lanzenstoß wirkt wie ein Angriff, der Stab der Magierin würde in Spear-Man hineinragen,
// Pear-Sons Winken-Bild ist fehlerhaft (Birne schwebt).
const MENU_POSE_OVERRIDES = {
  zeigen: { spearman: "winken", regression: "erklaeren" },
  winken: { pearson: "jubel" },
};

function setMenuCharacters(pose, selected = CHARACTER_NAMES) {
  for (const character of selected) {
    const actualPose = MENU_POSE_OVERRIDES[pose]?.[character] ?? pose;
    void menuCharacters.get(character).setPose(actualPose);
  }
}

const GREETING_DURATION = 1000;
const THINKING_DELAY = 4000;
let greetingTimer;
let thinkingTimer;

// Hauptmenü: beim Öffnen einmal kurz winken, danach Ruhe bzw. Zeigen (SPEC Abschnitt 10).
function greetMenu() {
  window.clearTimeout(greetingTimer);
  setMenuCharacters("winken");
  greetingTimer = window.setTimeout(() => {
    greetingTimer = undefined;
    if (!elements.startScreen.hidden) syncMenuCharacters();
  }, GREETING_DURATION);
}

// Schätzphase: nach 4 s ohne Eingabe nachdenken, bei der nächsten Eingabe zurück zur Ruhe.
function cancelThinking() {
  window.clearTimeout(thinkingTimer);
  thinkingTimer = undefined;
}

function scheduleThinking() {
  cancelThinking();
  thinkingTimer = window.setTimeout(() => {
    thinkingTimer = undefined;
    if (state.phase === "guess" && roundCharacter && !elements.form.hidden) {
      void roundCharacter.setPose("nachdenken");
    }
  }, THINKING_DELAY);
}

function registerGuessActivity() {
  if (state.phase !== "guess" || !roundCharacter) return;
  if (roundCharacter.pose === "nachdenken") void roundCharacter.setPose("ruhe");
  scheduleThinking();
}

function syncMenuCharacters() {
  if (greetingTimer) return;
  const attended = menuButtons.some((button) => (
    button === document.activeElement || button.matches(":hover")
  ));
  setMenuCharacters(attended ? "zeigen" : "ruhe");
}

function playMenuAction(selectedCharacters, action) {
  if (menuButtons.some((button) => button.disabled)) return;
  menuButtons.forEach((button) => {
    button.disabled = true;
  });
  window.clearTimeout(greetingTimer);
  greetingTimer = undefined;
  const animations = selectedCharacters.map((character) => (
    menuCharacters.get(character).setPose("jubel")
  ));
  Promise.all(animations)
    .then(() => new Promise((resolve) => {
      const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 600;
      window.setTimeout(resolve, delay);
    }))
    .then(() => {
      menuButtons.forEach((button) => {
        button.disabled = false;
      });
      action();
      if (!elements.startScreen.hidden) syncMenuCharacters();
    });
}

function showStorageNotice(message) {
  elements.startStorageNotice.textContent = message;
  elements.storageNotice.textContent = message;
}

function readHighscore() {
  try {
    const stored = localStorage.getItem(HIGH_SCORE_KEY);
    if (stored === null) return 0;
    const value = Number(stored);
    if (Number.isSafeInteger(value) && value >= 0) return value;
    showStorageNotice(TEXTS.invalidHighscore);
  } catch (error) {
    showStorageNotice(TEXTS.highscoreLoadError(error.message));
  }
  return 0;
}

let highscore = readHighscore();
elements.startHighscore.textContent = String(highscore);
let state = createGameState(highscore);

function saveHighscore(value) {
  if (value <= highscore) return;
  highscore = value;
  highscoreBeatenThisGame = true;
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(highscore));
  } catch (error) {
    showStorageNotice(TEXTS.highscoreSaveError(error.message));
  }
  elements.startHighscore.textContent = String(highscore);
}

function formatNumber(value) {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function renderHearts(previousLives = state.lives) {
  if (heartAnimationTimer) {
    window.clearTimeout(heartAnimationTimer);
    heartAnimationTimer = undefined;
  }
  const lostLife = state.lives < previousLives;
  const gainedLife = state.lives > previousLives;
  const animatedSlot = lostLife ? state.lives : previousLives;
  const slots = document.createElement("span");
  slots.className = "lives-slots";
  for (let index = 0; index < 3; index += 1) {
    const icon = document.createElement("span");
    icon.className = "icon heart-slot";
    const broken = lostLife && index === animatedSlot;
    const filling = gainedLife && index === animatedSlot;
    icon.append(createIcon(
      broken ? "herz-gebrochen" : index < state.lives ? "herz-voll" : "herz-leer",
    ));
    if (broken) icon.classList.add("is-breaking");
    if (filling) icon.classList.add("is-filling");
    slots.append(icon);
  }
  elements.lives.replaceChildren(slots);
  elements.lives.setAttribute("aria-label", `${TEXTS.lives}: ${state.lives} von 3`);
  if (lostLife) {
    const round = state.round;
    const lives = state.lives;
    heartAnimationTimer = window.setTimeout(() => {
      if (state.round !== round || state.lives !== lives) return;
      renderHearts();
    }, 540);
  }
}

function updateCoinDisplay(previousCoins = state.coins) {
  if (coinAnimationTimer) {
    window.clearInterval(coinAnimationTimer);
    coinAnimationTimer = undefined;
  }
  coinAnimationGeneration += 1;
  const generation = coinAnimationGeneration;
  const display = document.createElement("span");
  elements.coins.replaceChildren(display);
  const icon = document.createElement("span");
  icon.className = "icon status-icon";
  icon.append(createIcon("muenze"));
  elements.coins.prepend(icon);
  elements.coins.setAttribute("aria-label", `${TEXTS.coins}: ${state.coins}`);

  if (previousCoins >= state.coins || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    display.textContent = String(state.coins);
    return;
  }

  let visibleCoins = previousCoins;
  display.textContent = String(visibleCoins);
  coinAnimationTimer = window.setInterval(() => {
    if (generation !== coinAnimationGeneration) {
      window.clearInterval(coinAnimationTimer);
      return;
    }
    visibleCoins = Math.min(state.coins, visibleCoins + 1);
    display.textContent = String(visibleCoins);
    if (visibleCoins === state.coins) {
      window.clearInterval(coinAnimationTimer);
      coinAnimationTimer = undefined;
    }
  }, 70);
}

function updateStatus({ previousLives = state.lives, previousCoins = state.coins } = {}) {
  renderHearts(previousLives);
  updateCoinDisplay(previousCoins);
  elements.roundCount.textContent = String(state.round);
  elements.averageErrorDisplay.textContent = state.completedRounds
    ? formatNumber(state.totalError / state.completedRounds)
    : "–";
}

function beginRound() {
  const seed = Math.floor(Math.random() * 4294967296);
  const scenario = createScenario(seed, state.round + 1);
  elements.startScreen.hidden = true;
  elements.gameOverScreen.hidden = true;
  elements.gameScreen.hidden = false;
  elements.menuConfirmation.hidden = true;
  state = startRound(state, scenario);
  updateStatus();
  setIconLabel(
    elements.promptTitle,
    scenario.coefficient === "pearson" ? "linie" : "treppe",
    scenario.coefficient === "pearson" ? TEXTS.pearsonPrompt : TEXTS.spearmanPrompt,
  );
  elements.promptCaption.textContent = TEXTS.promptCaption;
  elements.promptBoard.classList.toggle("coefficient-pearson", scenario.coefficient === "pearson");
  elements.promptBoard.classList.toggle("coefficient-spearman", scenario.coefficient === "spearman");
  elements.promptBoard.style.removeProperty("padding-left");
  elements.slider.style.setProperty(
    "--coefficient-color",
    scenario.coefficient === "pearson" ? "var(--pearson)" : "var(--spearman)",
  );
  roundCharacter = createCharacterSprite(scenario.coefficient, {
    pose: "ruhe",
    scale: 2,
    className: "round-character-sprite",
  });
  elements.roundCharacter.replaceChildren(roundCharacter.element);
  elements.prompt.hidden = false;
  elements.form.hidden = false;
  elements.resolution.hidden = true;
  elements.inputError.textContent = "";
  elements.input.value = "0.00";
  elements.slider.value = "0";
  renderPlot(elements.plot, scenario.points, { random: createRng(scenario.seed).random });
  setIconLabel(elements.continueButton, "pfeil", TEXTS.continue);
  if (window.matchMedia("(pointer: fine)").matches) {
    elements.input.focus();
    elements.input.select();
  }
  scheduleThinking();
}

function appendCoefficient(label, value, highlighted, coefficient) {
  const item = document.createElement("div");
  item.className = `coefficient coefficient-${coefficient}${highlighted ? " coefficient-highlighted" : ""}`;
  const term = document.createElement("span");
  term.className = "coefficient-term";
  term.append(createIcon(coefficient === "pearson" ? "linie" : "treppe"), document.createTextNode(label));
  const number = document.createElement("strong");
  number.textContent = formatNumber(value);
  item.append(term, number);
  elements.coefficients.append(item);
}

function appendReward(icon, message) {
  const item = document.createElement("span");
  item.className = "reward-item";
  const iconElement = document.createElement("span");
  iconElement.className = "icon";
  iconElement.append(createIcon(icon));
  const text = document.createElement("span");
  text.textContent = message;
  item.append(iconElement, text);
  elements.roundReward.append(item);
}

function renderResolution(estimate, previousLives, previousCoins) {
  const { scenario, result } = state;
  const svg = elements.plot.querySelector("svg");
  elements.coefficients.replaceChildren();
  appendCoefficient(TEXTS.pearson, result.metrics.pearson, result.coefficient === "pearson", "pearson");
  appendCoefficient(TEXTS.spearman, result.metrics.spearman, result.coefficient === "spearman", "spearman");
  elements.guessResult.textContent = TEXTS.guessResult(
    formatNumber(estimate),
    formatNumber(result.error),
  );
  elements.roundReward.replaceChildren();
  if (result.coinsChange > 0) {
    appendReward("muenze", `+${result.coinsChange} ${TEXTS.coins}`);
  }
  if (result.livesChange > 0) {
    appendReward("herz-voll", `+1 ${TEXTS.life}`);
  } else if (result.livesChange < 0) {
    appendReward("herz-gebrochen", `−1 ${TEXTS.life}`);
  }
  if (result.coinsChange === 0 && result.livesChange === 0) {
    const unchanged = document.createElement("span");
    unchanged.textContent = TEXTS.noChange;
    elements.roundReward.append(unchanged);
  }

  const outcome = result.error <= 0.05 ? "perfect" : result.error <= 0.10 ? "good" : "miss";
  elements.resolution.dataset.outcome = outcome;
  const outcomeText = outcome === "perfect"
    ? TEXTS.perfectHit
    : outcome === "good" ? TEXTS.goodHit : TEXTS.missed;
  if (scenario.type === "normal") {
    elements.resolutionTitle.textContent = outcomeText;
  } else {
    const hint = createIcon("hinweis", { className: "special-case-icon", label: TEXTS.specialCase });
    hint.title = TEXTS.specialCase;
    const text = document.createElement("span");
    text.textContent = outcomeText;
    elements.resolutionTitle.replaceChildren(hint, text);
  }
  elements.resolutionRound.textContent = TEXTS.roundResolved(state.round);

  const explanation = explanationFor(scenario, result.metrics);
  if (explanation) {
    setIconLabel(elements.explanation, "gluehbirne", explanation);
  } else {
    elements.explanation.replaceChildren();
  }
  elements.explanation.hidden = !explanation;
  elements.regression.textContent = `${TEXTS.regressionSlope}: ${formatNumber(result.metrics.regression.b)}`;
  elements.groupResults.replaceChildren();

  if (scenario.type === "simpson") {
    colorizeGroups(svg);
    const lines = drawGroupRegressionLines(svg, scenario.points, scenario.groups);
    scenario.groups.forEach((group, index) => {
      const points = scenario.points.filter((point) => point.group === group);
      const correlation = pearson(
        points.map((point) => point.x),
        points.map((point) => point.y),
      );
      const row = document.createElement("p");
      row.textContent = TEXTS.groupCorrelation(
        index + 1,
        formatNumber(correlation),
        formatNumber(lines[index].b),
      );
      elements.groupResults.append(row);
    });
    drawRegressionLine(svg, scenario.points, {
      color: "#3F3F46",
      className: "regression-line overall-regression-line",
      strokeWidth: 4.5,
      strokeDasharray: "10 7",
    });
  } else {
    drawRegressionLine(svg, scenario.points, { color: "#416b38" });
  }
  if (scenario.type === "ausreisser") {
    markOutlier(svg, scenario.outlierIndex);
  }

  elements.form.hidden = true;
  elements.resolution.hidden = false;
  const reactingCharacter = roundCharacter;
  const spearmanPointing = result.coefficient === "spearman";
  if (spearmanPointing) {
    elements.promptBoard.style.paddingLeft = "5rem";
  }
  reactingCharacter.setPose("zeigen").then(() => {
    window.setTimeout(() => {
      reactingCharacter.setPose(result.error <= 0.10 ? "jubel" : "enttaeuscht")
        .then(() => {
          elements.promptBoard.style.removeProperty("padding-left");
        });
    }, 500);
  });
  setIconLabel(elements.continueButton, "pfeil", state.lives === 0 ? TEXTS.finish : TEXTS.continue);
  updateStatus({ previousLives, previousCoins });
  elements.continueButton.focus();
}

elements.slider.addEventListener("input", () => {
  elements.input.value = Number(elements.slider.value).toFixed(2);
  elements.inputError.textContent = "";
  elements.input.removeAttribute("aria-invalid");
});

elements.input.addEventListener("input", () => {
  const normalized = elements.input.value.trim().replace(",", ".");
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < -1 || value > 1) return;
  const steppedValue = Math.round(value * 100) / 100;
  elements.slider.value = String(steppedValue);
  elements.inputError.textContent = "";
  elements.input.removeAttribute("aria-invalid");
});

elements.input.addEventListener("change", () => {
  const normalized = elements.input.value.trim().replace(",", ".");
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < -1 || value > 1) return;
  const steppedValue = Math.round(value * 100) / 100;
  elements.input.value = steppedValue.toFixed(2);
  elements.slider.value = String(steppedValue);
});

elements.input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    elements.form.requestSubmit();
  }
});

function adjustGuessWithArrowKey(event) {
  if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();
  const normalized = elements.input.value.trim().replace(",", ".");
  const current = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)
    ? Number(normalized)
    : Number(elements.slider.value);
  const step = event.shiftKey ? 0.1 : 0.01;
  const direction = event.key === "ArrowUp" || event.key === "ArrowRight" ? 1 : -1;
  const next = Math.max(-1, Math.min(1, Math.round((current + direction * step) * 100) / 100));
  elements.input.value = next.toFixed(2);
  elements.slider.value = String(next);
  elements.inputError.textContent = "";
  elements.input.removeAttribute("aria-invalid");
}

elements.input.addEventListener("keydown", adjustGuessWithArrowKey);
elements.slider.addEventListener("keydown", adjustGuessWithArrowKey);

["input", "keydown", "pointerdown"].forEach((type) => {
  elements.form.addEventListener(type, registerGuessActivity);
});

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  cancelThinking();
  const normalized = elements.input.value.trim().replace(",", ".");
  const typedEstimate = Number(normalized);
  if (!normalized || !Number.isFinite(typedEstimate) || typedEstimate < -1 || typedEstimate > 1) {
    elements.inputError.textContent = TEXTS.invalidGuess;
    elements.input.setAttribute("aria-invalid", "true");
    elements.input.focus();
    return;
  }
  elements.input.removeAttribute("aria-invalid");
  const estimate = Math.round(typedEstimate * 100) / 100;
  elements.input.value = estimate.toFixed(2);
  const previousLives = state.lives;
  const previousCoins = state.coins;
  state = resolveRound(state, estimate);
  saveHighscore(state.highscore);
  renderResolution(estimate, previousLives, previousCoins);
});

elements.continueButton.addEventListener("click", () => {
  state = advanceRound(state);
  if (state.phase === "gameover") {
    elements.gameOverCoins.textContent = String(state.coins);
    elements.highscore.textContent = String(highscore);
    elements.gameOverMessage.textContent = highscoreBeatenThisGame
      ? TEXTS.newHighscore
      : TEXTS.highscoreUnchanged;
    elements.endCharacters.replaceChildren();
    for (const character of CHARACTER_NAMES) {
      const item = document.createElement("span");
      item.className = "end-character";
      const sprite = createCharacterSprite(character, {
        pose: highscoreBeatenThisGame ? "jubel" : "enttaeuscht",
        scale: 2,
      });
      item.append(sprite.element);
      elements.endCharacters.append(item);
    }
    elements.gameScreen.hidden = true;
    elements.gameOverScreen.hidden = false;
    elements.newGameButton.focus();
    return;
  }
  beginRound();
});

elements.startButton.addEventListener("pointerenter", syncMenuCharacters);
elements.startButton.addEventListener("focus", syncMenuCharacters);
elements.startButton.addEventListener("pointerleave", syncMenuCharacters);
elements.startButton.addEventListener("blur", syncMenuCharacters);
elements.rulesButton.addEventListener("pointerenter", syncMenuCharacters);
elements.rulesButton.addEventListener("focus", syncMenuCharacters);
elements.rulesButton.addEventListener("pointerleave", syncMenuCharacters);
elements.rulesButton.addEventListener("blur", syncMenuCharacters);

elements.startButton.addEventListener("click", () => {
  highscoreBeatenThisGame = false;
  playMenuAction(CHARACTER_NAMES, beginRound);
});

elements.rulesButton.addEventListener("click", () => {
  playMenuAction(["regression"], () => {
    const expanded = elements.rulesButton.getAttribute("aria-expanded") === "true";
    elements.rulesButton.setAttribute("aria-expanded", String(!expanded));
    elements.rulesCard.hidden = expanded;
  });
});

elements.newGameButton.addEventListener("click", () => {
  state = createGameState(highscore);
  highscoreBeatenThisGame = false;
  beginRound();
});

elements.menuButton.addEventListener("click", () => {
  elements.menuConfirmation.hidden = false;
  elements.menuButton.setAttribute("aria-expanded", "true");
  elements.menuConfirmNo.focus();
});

elements.menuConfirmNo.addEventListener("click", () => {
  elements.menuConfirmation.hidden = true;
  elements.menuButton.setAttribute("aria-expanded", "false");
  elements.menuButton.focus();
});

elements.menuConfirmYes.addEventListener("click", () => {
  state = createGameState(highscore);
  highscoreBeatenThisGame = false;
  elements.menuConfirmation.hidden = true;
  elements.menuButton.setAttribute("aria-expanded", "false");
  elements.gameScreen.hidden = true;
  elements.gameOverScreen.hidden = true;
  elements.startScreen.hidden = false;
  elements.startHighscore.textContent = String(highscore);
  cancelThinking();
  greetMenu();
  elements.startButton.focus();
});

elements.mainMenuButton.addEventListener("click", () => {
  state = createGameState(highscore);
  highscoreBeatenThisGame = false;
  elements.gameOverScreen.hidden = true;
  elements.startScreen.hidden = false;
  elements.startHighscore.textContent = String(highscore);
  greetMenu();
  elements.startButton.focus();
});
