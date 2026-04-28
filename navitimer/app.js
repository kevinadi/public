import {
  angleForValue,
  center,
  getTickValues,
  innerScaleParams,
  labelValues,
  outerScaleParams,
  polar,
  tickStrength,
} from "./e6b-math.js";
import {
  appendChildren,
  buildDefs,
  buildStaticBase,
  createCircle,
  createSvgElement,
  setLine,
} from "./app-render.js";

function createState() {
  return { outerRotation: 0, dragging: false, dragStartAngle: 0, startRotation: 0 };
}

function getAppElements(doc) {
  return {
    body: doc.body,
    svg: doc.getElementById("dialSvg"),
    themeToggle: doc.getElementById("themeToggle"),
    wallpaperToggle: doc.getElementById("wallpaperToggle"),
    resetRotation: doc.getElementById("resetRotation"),
    exitWallpaper: doc.getElementById("exitWallpaper"),
  };
}

function getBandEdges(bandRadius, bandWidth) {
  return {
    bandInnerEdge: bandRadius - bandWidth / 2,
    bandOuterEdge: bandRadius + bandWidth / 2,
  };
}

function getTickMetrics(strength) {
  if (strength === "major") {
    return { length: 28, width: 2.05, stroke: "var(--tick)" };
  }
  if (strength === "medium") {
    return { length: 18, width: 1.35, stroke: "var(--tick-soft)" };
  }
  return { length: 9, width: 0.78, stroke: "var(--tick-soft)" };
}

function createTickLine(doc, value, edges, direction) {
  const angle = angleForValue(value);
  const strength = tickStrength(value);
  const { length, width, stroke } = getTickMetrics(strength);
  const line = createSvgElement(doc, "line", {
    stroke,
    "stroke-width": width,
    "stroke-linecap": "round",
  });
  if (direction === "outer") {
    setLine(line, edges.bandInnerEdge + 6, edges.bandInnerEdge + 6 + length, angle);
  } else {
    setLine(line, edges.bandOuterEdge - 6, edges.bandOuterEdge - 6 - length, angle);
  }
  return line;
}

function getLabelRadius(options, value) {
  return options.labelRadiusForValue ? options.labelRadiusForValue(value) : options.textRadius;
}

function getLabelValuesForBand(options) {
  return options.labelValues ?? labelValues;
}

function createTickLabel(doc, value, options) {
  const angle = angleForValue(value);
  const point = polar(getLabelRadius(options, value), angle);
  const isTopIndex = value === 60 && options.direction === "outer";
  const isTenMarker = value === 10;
  const text = createSvgElement(doc, "text", {
    x: point.x,
    y: point.y,
    fill: isTopIndex || isTenMarker ? "var(--accent)" : options.textColor,
    "font-size": isTopIndex ? 30 : isTenMarker ? 24 : value <= 20 ? 22.5 : 24,
    "font-weight": isTopIndex || isTenMarker ? 700 : 650,
    "text-anchor": "middle",
    "dominant-baseline": "middle",
    transform: `rotate(${angle + 90} ${point.x} ${point.y})`,
    "letter-spacing": isTopIndex ? 1 : isTenMarker ? 0.8 : 0.4,
  });
  text.textContent = String(value);
  return text;
}

function createTickBandGroup(doc, options) {
  const group = createSvgElement(doc, "g", options.id ? { id: options.id } : {});
  const edges = getBandEdges(options.bandRadius, options.bandWidth);
  group.append(createCircle(doc, options.bandRadius, {
    fill: "none",
    stroke: options.bandStroke,
    "stroke-width": options.bandWidth,
  }));
  appendChildren(group, getTickValues().map((value) => createTickLine(doc, value, edges, options.direction)));
  appendChildren(group, getLabelValuesForBand(options).map((value) => createTickLabel(doc, value, options)));
  return group;
}

function buildOuterScale(doc, svg) {
  svg.append(createTickBandGroup(doc, {
    ...outerScaleParams,
    bandStroke: "var(--scale-band-outer)",
    textColor: "var(--text-main)",
    labelRadiusForValue(value) {
      return value <= 20 ? 338 : 334;
    },
  }));
}

function buildInnerScale(doc, svg) {
  svg.append(createTickBandGroup(doc, {
    ...innerScaleParams,
    bandStroke: "var(--scale-band-inner)",
    textColor: "var(--text-main)",
    labelValues: labelValues.filter((value) => value < 60 || value % 10 === 0),
    labelRadiusForValue(value) {
      return value <= 20 ? 224 : 222;
    },
  }));
}

function updateOuterRotationWithDeps(doc, state) {
  const outer = doc.getElementById("outerScaleGroup");
  outer.setAttribute("transform", `rotate(${state.outerRotation} ${center} ${center})`);
}

function pointFromEvent(svg, event) {
  const rect = svg.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * 800,
    y: ((event.clientY - rect.top) / rect.height) * 800,
  };
}

function pointAngle(point) {
  return Math.atan2(point.y - center, point.x - center) * (180 / Math.PI);
}

function normalizeAngleDelta(angle) {
  if (angle > 180) {
    return angle - 360;
  }
  if (angle < -180) {
    return angle + 360;
  }
  return angle;
}

function pointRadius(point) {
  return Math.hypot(point.x - center, point.y - center);
}

function nextTheme(currentTheme) {
  return currentTheme === "dark" ? "light" : "dark";
}

function setClassEnabled(classList, className, enabled) {
  if (enabled) {
    classList.add(className);
    return;
  }
  classList.remove(className);
}

function isWallpaperMode(classList) {
  return classList.contains("wallpaper-mode");
}

function toggleTheme(body, themeToggle) {
  const currentTheme = body.getAttribute("data-theme");
  const next = nextTheme(currentTheme);
  body.setAttribute("data-theme", next);
  themeToggle.textContent = next === "dark" ? "Light Mode" : "Dark Mode";
}

function setWallpaperMode(body, wallpaperToggle, enabled) {
  setClassEnabled(body.classList, "wallpaper-mode", enabled);
  wallpaperToggle.textContent = enabled ? "Wallpaper Active" : "Wallpaper Mode";
}

function toggleWallpaperMode(body, wallpaperToggle) {
  setWallpaperMode(body, wallpaperToggle, !isWallpaperMode(body.classList));
}

function handlePointerDown(event, svg, state) {
  const point = pointFromEvent(svg, event);
  const radius = pointRadius(point);
  if (radius < 276 || radius > 330) {
    return;
  }
  state.dragging = true;
  state.dragStartAngle = pointAngle(point);
  state.startRotation = state.outerRotation;
  svg.setPointerCapture(event.pointerId);
}

function handlePointerMove(event, doc, svg, state) {
  if (!state.dragging) {
    return;
  }
  const point = pointFromEvent(svg, event);
  const currentAngle = pointAngle(point);
  const angleDelta = normalizeAngleDelta(currentAngle - state.dragStartAngle);
  state.outerRotation = state.startRotation + angleDelta;
  updateOuterRotationWithDeps(doc, state);
}

function handlePointerUp(event, svg, state) {
  if (!state.dragging) {
    return;
  }
  state.dragging = false;
  if (svg.hasPointerCapture(event.pointerId)) {
    svg.releasePointerCapture(event.pointerId);
  }
}

function updateOuterRotation() {
  updateOuterRotationWithDeps(this.doc, this.state);
}

function resetBezel() {
  this.state.outerRotation = 0;
  this.updateOuterRotation();
}

function handleKeydown(event, body, wallpaperToggle) {
  if (event.key === "Escape" && isWallpaperMode(body.classList)) {
    setWallpaperMode(body, wallpaperToggle, false);
  }
}

function bindPointerHandlers(doc, elements, state) {
  const { svg } = elements;
  svg.addEventListener("pointerdown", (event) => handlePointerDown(event, svg, state));
  svg.addEventListener("pointermove", (event) => handlePointerMove(event, doc, svg, state));
  svg.addEventListener("pointerup", (event) => handlePointerUp(event, svg, state));
  svg.addEventListener("pointercancel", (event) => handlePointerUp(event, svg, state));
}

function bindControlHandlers(doc, elements, state) {
  const { body, themeToggle, wallpaperToggle, resetRotation, exitWallpaper } = elements;
  const rotationController = { doc, state, updateOuterRotation };
  themeToggle.addEventListener("click", () => toggleTheme(body, themeToggle));
  wallpaperToggle.addEventListener("click", () => toggleWallpaperMode(body, wallpaperToggle));
  resetRotation.addEventListener("click", () => resetBezel.call(rotationController));
  exitWallpaper.addEventListener("click", () => setWallpaperMode(body, wallpaperToggle, false));
  doc.addEventListener("keydown", (event) => handleKeydown(event, body, wallpaperToggle));
}

function renderDial(doc, svg) {
  buildDefs(doc, svg);
  buildStaticBase(doc, svg);
  buildOuterScale(doc, svg);
  buildInnerScale(doc, svg);
}

function registerServiceWorker(win, nav) {
  if (!win || !nav || !("serviceWorker" in nav)) {
    return { ok: false, reason: "unsupported" };
  }
  win.addEventListener("load", () => {
    nav.serviceWorker.register("./sw.js").catch(() => {});
  });
  return { ok: true };
}

function createAppController(doc, win, nav) {
  const elements = getAppElements(doc);
  const state = createState();

  return {
    render() {
      renderDial(doc, elements.svg);
      updateOuterRotationWithDeps(doc, state);
    },
    bind() {
      bindPointerHandlers(doc, elements, state);
      bindControlHandlers(doc, elements, state);
    },
    registerBrowserFeatures() {
      return registerServiceWorker(win, nav);
    },
  };
}

function main(doc = document, win = window, nav = navigator) {
  const app = createAppController(doc, win, nav);
  app.render();
  app.bind();
  app.registerBrowserFeatures();
}

main();
