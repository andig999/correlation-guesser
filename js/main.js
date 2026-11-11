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
import { createRng } from "./rng.js";
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
document.querySelector("#resolution-title").textContent = TEXTS.resolutionTitle;
document.querySelector("#game-over-title").textContent = TEXTS.gameOverTitle;
document.querySelector("#game-over-message").textContent = TEXTS.gameOverMessage;
document.querySelector("#game-over-coins-label").textContent = TEXTS.gameOverCoins;
document.querySelector("#highscore-label").textContent = TEXTS.highscore;
document.querySelector("#new-game-button").textContent = TEXTS.newGame;
document.querySelector("#continue-button").textContent = TEXTS.continue;

const elements = {
  startScreen: document.querySelector("#start-screen"),
  gameScreen: document.querySelector("#game-screen"),
  startHighscore: document.querySelector("#start-highscore-value"),
  startStorageNotice: document.querySelector("#start-storage-notice"),
  startButton: document.querySelector("#start-button"),
  rulesButton: document.querySelector("#rules-button"),
  rulesCard: document.querySelector("#rules-card"),
  prompt: document.querySelector("#round-prompt"),
  lives: document.querySelector("#lives-value"),
  coins: document.querySelector("#coins-value"),
  round: document.querySelector("#round-value"),
  averageError: document.querySelector("#average-error-value"),
  storageNotice: document.querySelector("#storage-notice"),
  plot: document.querySelector("#plot"),
  form: document.querySelector("#guess-form"),
  slider: document.querySelector("#guess-slider"),
  input: document.querySelector("#guess-input"),
  inputError: document.querySelector("#input-error"),
  resolution: document.querySelector("#resolution"),
  coefficients: document.querySelector("#coefficients"),
  guessResult: document.querySelector("#guess-result"),
  explanation: document.querySelector("#scenario-explanation"),
  regression: document.querySelector("#regression-slope"),
  groupResults: document.querySelector("#group-results"),
  continueButton: document.querySelector("#continue-button"),
  gameOver: document.querySelector("#game-over"),
  gameOverCoins: document.querySelector("#game-over-coins"),
  highscore: document.querySelector("#highscore-value"),
  newGameButton: document.querySelector("#new-game-button"),
};

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

function updateStatus() {
  elements.lives.textContent = String(state.lives);
  elements.coins.textContent = String(state.coins);
  elements.round.textContent = String(state.round);
  elements.averageError.textContent = state.completedRounds
    ? formatNumber(state.totalError / state.completedRounds)
    : "–";
}

function beginRound() {
  const seed = Math.floor(Math.random() * 4294967296);
  const scenario = createScenario(seed, state.round + 1);
  elements.startScreen.hidden = true;
  elements.gameScreen.hidden = false;
  state = startRound(state, scenario);
  updateStatus();
  elements.prompt.textContent = scenario.coefficient === "pearson"
    ? TEXTS.pearsonPrompt
    : TEXTS.spearmanPrompt;
  elements.prompt.hidden = false;
  elements.form.hidden = false;
  elements.resolution.hidden = true;
  elements.gameOver.hidden = true;
  elements.inputError.textContent = "";
  elements.input.value = "0.00";
  elements.slider.value = "0";
  renderPlot(elements.plot, scenario.points, { random: createRng(scenario.seed).random });
  elements.continueButton.textContent = TEXTS.continue;
  if (window.matchMedia("(pointer: fine)").matches) {
    elements.input.focus();
    elements.input.select();
  }
}

function appendCoefficient(label, value, highlighted) {
  const item = document.createElement("div");
  item.className = highlighted ? "coefficient coefficient-highlighted" : "coefficient";
  const term = document.createElement("span");
  term.textContent = label;
  const number = document.createElement("strong");
  number.textContent = formatNumber(value);
  item.append(term, number);
  elements.coefficients.append(item);
}

function renderResolution(estimate) {
  const { scenario, result } = state;
  const svg = elements.plot.querySelector("svg");
  elements.coefficients.replaceChildren();
  appendCoefficient(TEXTS.pearson, result.metrics.pearson, result.coefficient === "pearson");
  appendCoefficient(TEXTS.spearman, result.metrics.spearman, result.coefficient === "spearman");

  const rewards = [];
  if (result.coinsChange) rewards.push(`+${result.coinsChange} ${TEXTS.coins}`);
  if (result.livesChange > 0) rewards.push(`+1 ${TEXTS.life}`);
  if (result.livesChange < 0) rewards.push(`−1 ${TEXTS.life}`);
  if (rewards.length === 0) rewards.push(TEXTS.noChange);
  elements.guessResult.textContent = TEXTS.roundResult(
    formatNumber(estimate),
    formatNumber(result.error),
    rewards.join(", "),
  );

  elements.explanation.textContent = explanationFor(scenario, result.metrics);
  elements.explanation.hidden = !elements.explanation.textContent;
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
  } else {
    drawRegressionLine(svg, scenario.points);
  }
  if (scenario.type === "ausreisser") {
    markOutlier(svg, scenario.outlierIndex);
  }

  elements.prompt.hidden = true;
  elements.form.hidden = true;
  elements.resolution.hidden = false;
  elements.continueButton.textContent = state.lives === 0 ? TEXTS.finish : TEXTS.continue;
  updateStatus();
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

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
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
  state = resolveRound(state, estimate);
  saveHighscore(state.highscore);
  renderResolution(estimate);
});

elements.continueButton.addEventListener("click", () => {
  state = advanceRound(state);
  if (state.phase === "gameover") {
    elements.prompt.hidden = true;
    elements.plot.replaceChildren();
    elements.resolution.hidden = true;
    elements.gameOverCoins.textContent = String(state.coins);
    elements.highscore.textContent = String(highscore);
    elements.gameOver.hidden = false;
    updateStatus();
    elements.newGameButton.focus();
    return;
  }
  beginRound();
});

elements.startButton.addEventListener("click", beginRound);

elements.rulesButton.addEventListener("click", () => {
  const expanded = elements.rulesButton.getAttribute("aria-expanded") === "true";
  elements.rulesButton.setAttribute("aria-expanded", String(!expanded));
  elements.rulesCard.hidden = expanded;
});

elements.newGameButton.addEventListener("click", () => {
  state = createGameState(highscore);
  beginRound();
});
