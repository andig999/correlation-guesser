import { linearRegression, pearson, spearman } from "./stats.js";

export function createGameState(highscore = 0) {
  if (!Number.isFinite(highscore) || highscore < 0) {
    throw new RangeError("Highscore must be a non-negative finite number.");
  }

  return {
    phase: "ready",
    lives: 3,
    coins: 0,
    highscore,
    round: 0,
    totalError: 0,
    completedRounds: 0,
    scenario: null,
    result: null,
  };
}

export function startRound(state, scenario) {
  if (state.phase !== "ready" || !scenario || !Array.isArray(scenario.points)
    || !["pearson", "spearman"].includes(scenario.coefficient)) {
    throw new TypeError("A ready game and a valid scenario are required to start a round.");
  }

  return {
    ...state,
    phase: "guess",
    round: state.round + 1,
    scenario,
    result: null,
  };
}

export function resolveRound(state, estimate) {
  if (state.phase !== "guess" || !Number.isFinite(estimate) || estimate < -1 || estimate > 1) {
    throw new RangeError("A valid guess between -1 and 1 is required.");
  }

  const { scenario } = state;
  const x = scenario.points.map((point) => point.x);
  const y = scenario.points.map((point) => point.y);
  const metrics = {
    pearson: pearson(x, y),
    spearman: spearman(x, y),
    regression: linearRegression(x, y),
  };
  const actual = metrics[scenario.coefficient];
  if (!Number.isFinite(actual) || !Number.isFinite(metrics.regression.b)) {
    throw new RangeError("The generated scenario has invalid statistics.");
  }

  const error = Math.round(Math.abs(estimate - actual) * 100) / 100;
  let livesChange = 0;
  let coinsChange = 0;
  if (error <= 0.05) {
    livesChange = 1;
    coinsChange = 5;
  } else if (error <= 0.10) {
    coinsChange = 1;
  } else {
    livesChange = -1;
  }

  const lives = state.lives + livesChange;
  const coins = state.coins + coinsChange;
  const completedRounds = state.completedRounds + 1;
  return {
    ...state,
    phase: "resolution",
    lives,
    coins,
    highscore: Math.max(state.highscore, coins),
    totalError: state.totalError + error,
    completedRounds,
    result: {
      coefficient: scenario.coefficient,
      estimate,
      actual,
      error,
      coinsChange,
      livesChange,
      metrics,
      averageError: (state.totalError + error) / completedRounds,
    },
  };
}

export function advanceRound(state) {
  if (state.phase !== "resolution") {
    throw new TypeError("A resolved round is required to continue.");
  }

  return {
    ...state,
    phase: state.lives === 0 ? "gameover" : "ready",
  };
}
