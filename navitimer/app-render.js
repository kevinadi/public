import {
  center,
  polar,
  topIndexLineCoords,
  topIndexTrianglePath,
} from "./e6b-math.js";

const svgNS = "http://www.w3.org/2000/svg";

export function createSvgElement(doc, name, attrs = {}) {
  const element = doc.createElementNS(svgNS, name);
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

export function appendChildren(parent, children) {
  parent.append(...children);
}

export function createCircle(doc, radius, attrs = {}) {
  return createSvgElement(doc, "circle", {
    cx: center,
    cy: center,
    r: radius,
    ...attrs,
  });
}

export function setLine(line, r1, r2, angleDeg) {
  const p1 = polar(r1, angleDeg);
  const p2 = polar(r2, angleDeg);
  line.setAttribute("x1", p1.x);
  line.setAttribute("y1", p1.y);
  line.setAttribute("x2", p2.x);
  line.setAttribute("y2", p2.y);
}

function createText(doc, textContent, radius, angleDeg, attrs = {}) {
  const point = polar(radius, angleDeg);
  const text = createSvgElement(doc, "text", {
    x: point.x,
    y: point.y,
    "text-anchor": "middle",
    "dominant-baseline": "middle",
    ...attrs,
  });
  text.textContent = textContent;
  return text;
}

function createBezelTick(doc, angle) {
  const line = createSvgElement(doc, "line", {
    stroke: angle % 6 === 0 ? "var(--bezel-stroke)" : "var(--bezel-stroke-soft)",
    "stroke-width": angle % 6 === 0 ? 3 : 1.2,
    "stroke-linecap": "round",
  });
  setLine(line, 360, 378, angle);
  return line;
}

function createBezelTicks(doc) {
  const lines = [];
  for (let angle = 0; angle < 360; angle += 3) {
    lines.push(createBezelTick(doc, angle));
  }
  return lines;
}

function createTopIndex(doc) {
  const topTriangle = createSvgElement(doc, "path", {
    d: topIndexTrianglePath,
    fill: "var(--accent)",
    filter: "url(#softGlow)",
  });
  return [topTriangle];
}

function createCenterCore(doc) {
  return [
    createCircle(doc, 84, {
      fill: "rgba(0,0,0,0.25)",
      stroke: "var(--bezel-stroke)",
      "stroke-width": 1.4,
    }),
    createCircle(doc, 50, {
      fill: "rgba(255,255,255,0.04)",
      stroke: "var(--center-core-stroke)",
      "stroke-width": 1,
    }),
    createSvgElement(doc, "line", {
      x1: 354,
      y1: 400,
      x2: 446,
      y2: 400,
      stroke: "var(--center-crosshair)",
      "stroke-width": 1,
    }),
    createSvgElement(doc, "line", {
      x1: 400,
      y1: 354,
      x2: 400,
      y2: 446,
      stroke: "var(--center-crosshair)",
      "stroke-width": 1,
    }),
  ];
}

function createCenterText(doc) {
  return [
    createText(doc, "E6B", 0, 0, {
      fill: "var(--text-main)",
      "font-size": 16,
      "font-weight": 700,
      "letter-spacing": 3.6,
    }),
    createText(doc, "NAVITIMER-STYLE MOCKUP", 26, 90, {
      fill: "var(--text-soft)",
      "font-size": 8,
      "font-weight": 600,
      "letter-spacing": 2.2,
    }),
  ];
}

function createStaticBaseGroup(doc) {
  const group = createSvgElement(doc, "g");
  appendChildren(group, [
    createCircle(doc, 380, {
      fill: "url(#bezelGradient)",
      stroke: "var(--bezel-stroke-strong)",
      "stroke-width": 2,
    }),
    createCircle(doc, 360, {
      fill: "url(#dialGradient)",
      stroke: "var(--bezel-stroke-soft)",
      "stroke-width": 1.5,
    }),
    ...createBezelTicks(doc),
    createCircle(doc, 318, {
      fill: "none",
      stroke: "var(--dial-stroke-soft)",
      "stroke-width": 1,
    }),
    createCircle(doc, 236, {
      fill: "none",
      stroke: "var(--dial-stroke-soft)",
      "stroke-width": 1,
    }),
    ...createTopIndex(doc),
    ...createCenterCore(doc),
    ...createCenterText(doc),
  ]);
  return group;
}

function createGradient(doc, name, attrs, stops) {
  const gradient = createSvgElement(doc, name, attrs);
  appendChildren(gradient, stops.map((stop) => createSvgElement(doc, "stop", stop)));
  return gradient;
}

function createGlowFilter(doc) {
  const glow = createSvgElement(doc, "filter", {
    id: "softGlow",
    x: "-20%",
    y: "-20%",
    width: "140%",
    height: "140%",
  });
  glow.append(createSvgElement(doc, "feDropShadow", {
    dx: "0",
    dy: "0",
    stdDeviation: "7",
    "flood-color": "var(--accent)",
    "flood-opacity": "0.22",
  }));
  return glow;
}

export function buildDefs(doc, svg) {
  const defs = createSvgElement(doc, "defs");
  const bezelGradient = createGradient(doc, "linearGradient", {
    id: "bezelGradient",
    x1: "0%",
    y1: "0%",
    x2: "100%",
    y2: "100%",
  }, [
    { offset: "0%", "stop-color": "var(--bezel-metal-3)" },
    { offset: "42%", "stop-color": "var(--bezel-metal-1)" },
    { offset: "100%", "stop-color": "var(--bezel-metal-2)" },
  ]);
  const dialGradient = createGradient(doc, "radialGradient", { id: "dialGradient" }, [
    { offset: "0%", "stop-color": "var(--dial-inner)" },
    { offset: "76%", "stop-color": "var(--dial-main)" },
    { offset: "100%", "stop-color": "var(--dial-core)" },
  ]);
  appendChildren(defs, [bezelGradient, dialGradient, createGlowFilter(doc)]);
  svg.append(defs);
}

export function buildStaticBase(doc, svg) {
  svg.append(createStaticBaseGroup(doc));
}
