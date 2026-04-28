// Pure geometry and scale logic extracted from app.js for testability.
// The implementer must wire app.js to import from this module (or inline
// equivalent logic). These functions are the canonical specification of
// the E6B slide-rule math.

const center = 400;

export function angleForValue(value) {
  return -90 + (Math.log10(value / 60) * 360);
}

export function polar(radius, angleDeg) {
  const angle = (angleDeg * Math.PI) / 180;
  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius,
  };
}

export function isMultiple(value, step) {
  return Math.abs(value / step - Math.round(value / step)) < 1e-6;
}

export function getTickValues() {
  const values = [];

  const pushRange = (start, end, step) => {
    for (let value = start; value < end - 0.0001; value += step) {
      values.push(Number(value.toFixed(2)));
    }
  };

  pushRange(10, 20, 0.1);
  pushRange(20, 40, 0.2);
  pushRange(40, 60, 0.5);
  pushRange(60, 100, 1);

  values.push(60);

  return [...new Set(values)].sort((a, b) => a - b);
}

export function tickStrength(value) {
  if (value < 20) {
    if (Number.isInteger(value)) {
      return "major";
    }
    return isMultiple(value, 0.5) ? "medium" : "minor";
  }

  if (value < 40) {
    if (isMultiple(value, 2)) {
      return "major";
    }
    return Number.isInteger(value) ? "medium" : "minor";
  }

  if (value < 60) {
    if (isMultiple(value, 5)) {
      return "major";
    }
    return Number.isInteger(value) ? "medium" : "minor";
  }

  if (isMultiple(value, 10)) {
    return "major";
  }
  return isMultiple(value, 5) ? "medium" : "minor";
}

export const labelValues = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 26, 28, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90];

// Build parameters for the two scale bands — extracted so tests can
// verify geometry without requiring DOM rendering.
export const outerScaleParams = {
  id: "outerScaleGroup",
  bandRadius: 302,
  bandWidth: 42,
  direction: "outer",
  textRadius: 356,
};

export const innerScaleParams = {
  bandRadius: 258,
  bandWidth: 42,
  direction: "inner",
  textRadius: 222,
};

// Full dial radius (outermost structural circle)
export const fullDialRadius = 380;

// Top index triangle path data (extracted from buildStaticBase)
export const topIndexTrianglePath = "M400 14 L406 28 L394 28 Z";
export const topIndexLineCoords = { x1: 400, y1: 56, x2: 400, y2: 108 };

// Center circle radius
export const centerCircleRadius = 84;

// The SVG center coordinate
export { center };
