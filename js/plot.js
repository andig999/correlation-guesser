import { linearRegression } from "./stats.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const VIEW_SIZE = 600;
const PLOT = { left: 66, right: 570, top: 26, bottom: 530 };
const TICKS = [0, 25, 50, 75, 100];
const COLORS = ["#005B94", "#6F4E9C", "#805000", "#4A5568", "#0072B2", "#A65F00"];
const GROUP_COLORS = ["#005B94", "#6F4E9C", "#805000"];
const SYMBOLS = ["circle", "square", "triangle", "diamond", "cross"];
const GROUP_SYMBOLS = ["circle", "triangle", "square"];
let nextClipId = 0;

function createSvgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, String(value));
  }
  return element;
}

function getCoordinates(x, y) {
  return {
    x: PLOT.left + (x / 100) * (PLOT.right - PLOT.left),
    y: PLOT.bottom - (y / 100) * (PLOT.bottom - PLOT.top),
  };
}

function appendSymbol(parent, symbol, x, y, size, attributes = {}) {
  let shape;
  if (symbol === "circle") {
    shape = createSvgElement("circle", { cx: x, cy: y, r: size });
  } else if (symbol === "square") {
    shape = createSvgElement("rect", {
      x: x - size,
      y: y - size,
      width: size * 2,
      height: size * 2,
      rx: 0.6,
    });
  } else if (symbol === "triangle") {
    shape = createSvgElement("path", {
      d: `M ${x} ${y - size * 1.2} L ${x + size * 1.05} ${y + size * 0.8} L ${x - size * 1.05} ${y + size * 0.8} Z`,
    });
  } else if (symbol === "diamond") {
    shape = createSvgElement("path", {
      d: `M ${x} ${y - size * 1.25} L ${x + size} ${y} L ${x} ${y + size * 1.25} L ${x - size} ${y} Z`,
    });
  } else {
    shape = createSvgElement("path", {
      d: `M ${x - size} ${y - size} L ${x + size} ${y + size} M ${x + size} ${y - size} L ${x - size} ${y + size}`,
      fill: "none",
      stroke: "currentColor",
      "stroke-width": size * 0.65,
      "stroke-linecap": "round",
    });
  }

  for (const [key, value] of Object.entries(attributes)) {
    shape.setAttribute(key, String(value));
  }
  if (symbol !== "cross") {
    shape.setAttribute("stroke", "#fff");
    shape.setAttribute("stroke-width", "0.8");
  }
  parent.append(shape);
  return shape;
}

function addAxes(svg) {
  const axisAttributes = {
    stroke: "#253244",
    "stroke-width": 1.5,
    "shape-rendering": "crispEdges",
  };
  svg.append(
    createSvgElement("line", {
      ...axisAttributes,
      x1: PLOT.left,
      y1: PLOT.top,
      x2: PLOT.left,
      y2: PLOT.bottom,
    }),
    createSvgElement("line", {
      ...axisAttributes,
      x1: PLOT.left,
      y1: PLOT.bottom,
      x2: PLOT.right,
      y2: PLOT.bottom,
    }),
  );

  for (const tick of TICKS) {
    const position = getCoordinates(tick, tick);
    svg.append(
      createSvgElement("line", {
        x1: PLOT.left,
        y1: position.y,
        x2: PLOT.right,
        y2: position.y,
        stroke: tick === 0 ? "#253244" : "#d9e0e8",
        "stroke-width": tick === 0 ? 0 : 1,
      }),
      createSvgElement("line", {
        x1: position.x,
        y1: PLOT.bottom,
        x2: position.x,
        y2: PLOT.bottom + 5,
        stroke: "#253244",
        "stroke-width": 1.2,
      }),
      createSvgElement("line", {
        x1: PLOT.left - 5,
        y1: position.y,
        x2: PLOT.left,
        y2: position.y,
        stroke: "#253244",
        "stroke-width": 1.2,
      }),
    );

    const xLabel = createSvgElement("text", {
      x: position.x,
      y: PLOT.bottom + 23,
      "text-anchor": "middle",
      class: "plot-tick-label",
    });
    xLabel.textContent = String(tick);
    const yLabel = createSvgElement("text", {
      x: PLOT.left - 10,
      y: position.y + 4,
      "text-anchor": "end",
      class: "plot-tick-label",
    });
    yLabel.textContent = String(tick);
    svg.append(xLabel, yLabel);
  }

  const xLabel = createSvgElement("text", {
    x: (PLOT.left + PLOT.right) / 2,
    y: 588,
    "text-anchor": "middle",
    class: "plot-axis-label",
  });
  xLabel.textContent = "x";
  const yLabel = createSvgElement("text", {
    x: 19,
    y: (PLOT.top + PLOT.bottom) / 2,
    "text-anchor": "middle",
    class: "plot-axis-label",
    transform: `rotate(-90 19 ${(PLOT.top + PLOT.bottom) / 2})`,
  });
  yLabel.textContent = "y";
  svg.append(xLabel, yLabel);
}

export function renderPlot(container, points, { random } = {}) {
  if (!(container instanceof Element)) {
    throw new TypeError("Expected a DOM element as the plot container.");
  }
  if (!Array.isArray(points) || points.length === 0
    || points.some(({ x, y }) => !Number.isFinite(x) || !Number.isFinite(y)
      || x < 0 || x > 100 || y < 0 || y > 100)) {
    throw new RangeError("Expected points with finite x and y values between 0 and 100.");
  }
  if (typeof random !== "function") {
    throw new TypeError("Expected a random number generator function.");
  }

  const color = COLORS[Math.floor(random() * COLORS.length)];
  const symbol = SYMBOLS[Math.floor(random() * SYMBOLS.length)];
  const size = 4.8 + random() * 1.8;
  const opacity = 0.86 + random() * 0.14;
  const svg = createSvgElement("svg", {
    viewBox: `0 0 ${VIEW_SIZE} ${VIEW_SIZE}`,
    role: "img",
    "aria-label": "Quadratisches Streudiagramm mit x- und y-Achse von 0 bis 100",
    class: "scatterplot",
  });

  const clipId = `plot-clip-${++nextClipId}`;
  const clipPath = createSvgElement("clipPath", { id: clipId });
  clipPath.append(createSvgElement("rect", {
    x: PLOT.left,
    y: PLOT.top,
    width: PLOT.right - PLOT.left,
    height: PLOT.bottom - PLOT.top,
  }));
  const defs = createSvgElement("defs");
  defs.append(clipPath);
  svg.append(defs);
  addAxes(svg);
  const pointLayer = createSvgElement("g", { class: "plot-points" });
  points.forEach((point, index) => {
    const position = getCoordinates(point.x, point.y);
    const marker = createSvgElement("g", {
      class: "plot-point",
      "data-index": index,
      "data-x": position.x,
      "data-y": position.y,
      "data-group": point.group ?? "",
      fill: color,
      color,
      opacity,
    });
    appendSymbol(marker, symbol, position.x, position.y, size);
    pointLayer.append(marker);
  });
  svg.append(pointLayer);
  container.replaceChildren(svg);
  return svg;
}

export function drawRegressionLine(svg, points, {
  color = "#172b4d",
  className = "regression-line",
  strokeWidth = 2.5,
  strokeDasharray,
} = {}) {
  if (!(svg instanceof SVGElement) || !Array.isArray(points) || points.length < 3) {
    throw new TypeError("Expected an SVG plot and at least three points.");
  }

  const x = points.map((point) => point.x);
  const y = points.map((point) => point.y);
  const { a, b } = linearRegression(x, y);
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new RangeError("Cannot draw a regression line for these points.");
  }
  const minimumX = Math.min(...x);
  const maximumX = Math.max(...x);
  const start = getCoordinates(minimumX, a + b * minimumX);
  const end = getCoordinates(maximumX, a + b * maximumX);
  const line = createSvgElement("line", {
    class: className,
    x1: start.x,
    y1: start.y,
    x2: end.x,
    y2: end.y,
    stroke: color,
    "stroke-width": strokeWidth,
    "stroke-linecap": "round",
    ...(strokeDasharray ? { "stroke-dasharray": strokeDasharray } : {}),
    "clip-path": `url(#${svg.querySelector("clipPath").id})`,
    "aria-label": `Regressionsgerade, Steigung b = ${b.toFixed(2)}`,
  });
  svg.append(line);
  return { line, a, b };
}

export function drawGroupRegressionLines(svg, points, groups) {
  const groupIds = groups ?? [...new Set(points.map((point) => point.group))];
  return groupIds.map((group, index) => {
    const groupPoints = points.filter((point) => point.group === group);
    return drawRegressionLine(svg, groupPoints, {
      color: GROUP_COLORS[index % GROUP_COLORS.length],
      className: "regression-line group-regression-line",
    });
  });
}

export function colorizeGroups(svg) {
  if (!(svg instanceof SVGElement)) {
    throw new TypeError("Expected an SVG plot.");
  }

  const groupIndexes = new Map();
  for (const marker of svg.querySelectorAll(".plot-point[data-group]:not([data-group=''])")) {
    const group = marker.getAttribute("data-group");
    if (!groupIndexes.has(group)) {
      groupIndexes.set(group, groupIndexes.size);
    }
    marker.replaceChildren();
    appendSymbol(
      marker,
      GROUP_SYMBOLS[groupIndexes.get(group) % GROUP_SYMBOLS.length],
      Number(marker.getAttribute("data-x")),
      Number(marker.getAttribute("data-y")),
      6.1,
    );
    const color = GROUP_COLORS[groupIndexes.get(group) % GROUP_COLORS.length];
    marker.setAttribute("fill", color);
    marker.setAttribute("color", color);
    marker.setAttribute("opacity", "0.95");
  }
}

export function markOutlier(svg, pointIndex) {
  if (!(svg instanceof SVGElement) || !Number.isInteger(pointIndex) || pointIndex < 0) {
    throw new TypeError("Expected an SVG plot and a non-negative point index.");
  }
  const marker = svg.querySelector(`.plot-point[data-index="${pointIndex}"]`);
  if (!marker) {
    throw new RangeError(`No plot point exists at index ${pointIndex}.`);
  }

  const ring = createSvgElement("circle", {
    class: "outlier-marker",
    cx: marker.getAttribute("data-x"),
    cy: marker.getAttribute("data-y"),
    r: 10,
    fill: "none",
    stroke: "#7A1FA2",
    "stroke-width": 2.5,
    "aria-label": "Ausreißer",
  });
  svg.append(ring);
  return ring;
}
