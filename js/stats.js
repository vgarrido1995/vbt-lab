/*
 * js/stats.js
 * Funciones puras de estadística usadas por todos los módulos.
 *  - linearRegression(points)        regresión lineal por mínimos cuadrados
 *  - polynomialRegression2(points)   regresión polinómica de grado 2 vía mathjs
 *  - rSquared(observed, predicted)   coeficiente de determinación
 *  - solveQuadratic(a,b,c)           raíces reales de ax²+bx+c=0
 *
 * mathjs se asume cargado globalmente como `math` (CDN en index.html).
 */

/**
 * Regresión lineal simple y = slope·x + intercept.
 * @param {{x:number,y:number}[]} points
 * @returns {{slope:number,intercept:number,r2:number,predict:(x:number)=>number,equation:string}}
 */
export function linearRegression(points) {
  const n = points.length;
  if (n < 2) throw new Error('Se requieren al menos 2 puntos para una regresión lineal.');
  const sumX  = points.reduce((s, p) => s + p.x, 0);
  const sumY  = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const meanY = sumY / n;
  const denom = n * sumX2 - sumX * sumX;
  if (Math.abs(denom) < 1e-12) throw new Error('Puntos colineales en X — pendiente indefinida.');
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const ssTot = points.reduce((s, p) => s + Math.pow(p.y - meanY, 2), 0);
  const ssRes = points.reduce((s, p) => s + Math.pow(p.y - (slope * p.x + intercept), 2), 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return {
    slope,
    intercept,
    r2,
    predict: (x) => slope * x + intercept,
    equation: `y = ${slope.toFixed(4)}·x + ${intercept.toFixed(4)}`
  };
}

/**
 * Regresión polinómica de grado 2: y = a·x² + b·x + c
 * Se resuelve por sistema normal (Xᵀ X) β = Xᵀ y con mathjs.
 */
export function polynomialRegression2(points) {
  if (points.length < 3) throw new Error('Se requieren al menos 3 puntos para una regresión cuadrática.');
  const X = points.map(p => [1, p.x, p.x * p.x]);
  const Y = points.map(p => p.y);
  const Xt = math.transpose(X);
  const XtX = math.multiply(Xt, X);
  const XtY = math.multiply(Xt, Y);
  const sol = math.lusolve(XtX, XtY).map(r => r[0]); // [c, b, a]
  const [c, b, a] = sol;
  const meanY = Y.reduce((s, v) => s + v, 0) / Y.length;
  const ssTot = Y.reduce((s, v) => s + (v - meanY) ** 2, 0);
  const ssRes = points.reduce((s, p) => s + (p.y - (a * p.x ** 2 + b * p.x + c)) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return {
    a, b, c, r2,
    predict: (x) => a * x * x + b * x + c,
    equation: `y = ${a.toFixed(4)}·x² + ${b.toFixed(4)}·x + ${c.toFixed(4)}`
  };
}

/** R² genérico a partir de observados y predichos. */
export function rSquared(observed, predicted) {
  const mean = observed.reduce((s, v) => s + v, 0) / observed.length;
  const ssTot = observed.reduce((s, v) => s + (v - mean) ** 2, 0);
  const ssRes = observed.reduce((s, v, i) => s + (v - predicted[i]) ** 2, 0);
  return ssTot === 0 ? 1 : 1 - ssRes / ssTot;
}

/** Raíces reales de a·x² + b·x + c = 0. */
export function solveQuadratic(a, b, c) {
  if (Math.abs(a) < 1e-12) return Math.abs(b) < 1e-12 ? [] : [-c / b];
  const disc = b * b - 4 * a * c;
  if (disc < 0) return [];
  const sq = Math.sqrt(disc);
  return [(-b + sq) / (2 * a), (-b - sq) / (2 * a)];
}
