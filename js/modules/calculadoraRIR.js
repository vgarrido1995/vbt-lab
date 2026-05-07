/*
 * js/modules/calculadoraRIR.js — Práctica 7
 * Calculadora de RIR (Repetitions In Reserve) en función de la velocidad.
 *
 * Modelo: RIR = m · v + n   (regresión lineal sobre todos los datos del atleta).
 * "Modelo múltiple/individual": una sola ecuación que combina varias cargas relativas.
 *
 * Datos de calibración del manual (Práctica 7, remo invertido — 18 puntos):
 * Ecuación esperada ≈ y = 27,13x − 17,04 (R² ≈ 0,65).
 */
import { h, clear, validateNumber, formatDecimal, showToast, statCard, button, moduleHeader, card, copyToClipboard, downloadDataUrl } from '../ui.js';
import { linearRegression } from '../stats.js';
import { store } from '../store.js';
import { makeScatterWithRegression, destroyChart } from '../charts.js';

const KEY = 'rir';

// Set de calibración del manual (remo invertido, 60-70-80 %1RM, 18 mediciones).
// Valores aproximados (RIR observado, velocidad m/s) por carga.
const EJEMPLO = [
  // 60 %1RM
  { pct: 60, rir: 5, vm: 0.95 }, { pct: 60, rir: 4, vm: 0.88 }, { pct: 60, rir: 3, vm: 0.82 },
  { pct: 60, rir: 2, vm: 0.74 }, { pct: 60, rir: 1, vm: 0.69 }, { pct: 60, rir: 0, vm: 0.63 },
  // 70 %1RM
  { pct: 70, rir: 5, vm: 0.86 }, { pct: 70, rir: 4, vm: 0.79 }, { pct: 70, rir: 3, vm: 0.73 },
  { pct: 70, rir: 2, vm: 0.67 }, { pct: 70, rir: 1, vm: 0.61 }, { pct: 70, rir: 0, vm: 0.55 },
  // 80 %1RM
  { pct: 80, rir: 5, vm: 0.74 }, { pct: 80, rir: 4, vm: 0.68 }, { pct: 80, rir: 3, vm: 0.62 },
  { pct: 80, rir: 2, vm: 0.55 }, { pct: 80, rir: 1, vm: 0.49 }, { pct: 80, rir: 0, vm: 0.43 }
];

let state = {
  tab: 'calibrate',
  rows: [],
  ecuacion: null,
  predV: ''
};
let chart = null;

export function mount(container) {
  state = store.get(KEY) || state;
  if (!Array.isArray(state.rows) || !state.rows.length) {
    state.rows = Array.from({ length: 6 }, () => ({ pct: '', rir: '', vm: '' }));
  }
  render(container);
}

function render(container) {
  clear(container);
  if (chart) { destroyChart(chart); chart = null; }
  container.appendChild(moduleHeader(
    'Calculadora de RIR (Repetitions In Reserve)',
    'Práctica 7 · Construye una ecuación individual RIR-velocidad y úsala en tiempo real para estimar cuántas reps te quedan antes del fallo.'
  ));

  const tabs = h('div', { class: 'inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-4' }, [
    tabBtn('Calibrar ecuación', 'calibrate', container),
    tabBtn('Calcular RIR ahora', 'compute', container)
  ]);
  container.appendChild(tabs);

  if (state.tab === 'calibrate') container.appendChild(calibrateView(container));
  else container.appendChild(computeView(container));
}

function tabBtn(label, id, container) {
  const active = state.tab === id;
  return h('button', {
    class: `px-4 py-1.5 text-sm font-semibold rounded-lg transition ${active ? 'bg-white dark:bg-slate-900 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`,
    onclick: () => { state.tab = id; persist(); render(container); }
  }, label);
}

function calibrateView(container) {
  const tbody = h('tbody', { class: 'divide-y divide-slate-200 dark:divide-slate-800' });
  state.rows.forEach((r, i) => {
    tbody.appendChild(h('tr', { class: 'hover:bg-slate-50 dark:hover:bg-slate-800/50' }, [
      h('td', { class: 'py-2 pr-2 text-slate-500' }, String(i + 1)),
      h('td', { class: 'py-2 pr-2' }, [numInput(r, 'pct', '0.5', '%')]),
      h('td', { class: 'py-2 pr-2' }, [numInput(r, 'rir', '1', 'reps')]),
      h('td', { class: 'py-2 pr-2' }, [numInput(r, 'vm', '0.01', 'm/s')]),
      h('td', { class: 'py-2 text-right' }, [
        h('button', {
          class: 'text-rose-500 hover:text-rose-400 text-sm', title: 'Eliminar',
          onclick: () => { state.rows.splice(i, 1); if (!state.rows.length) state.rows.push({ pct: '', rir: '', vm: '' }); persist(); render(container); }
        }, '🗑')
      ])
    ]));
  });

  return card([
    h('h2', { class: 'font-semibold text-lg mb-2' }, 'Datos de calibración'),
    h('p', { class: 'text-sm text-slate-500 mb-3' }, 'Mezcla mediciones a varias cargas relativas (60 %, 70 %, 80 % 1RM) con sus pares (RIR observado, velocidad media). Modelo múltiple recomendado por el manual.'),
    h('div', { class: 'overflow-x-auto' }, [
      h('table', { class: 'w-full text-sm' }, [
        h('thead', { class: 'text-xs uppercase tracking-wider text-slate-500' }, [
          h('tr', {}, [
            h('th', { class: 'text-left py-2 pr-2' }, '#'),
            h('th', { class: 'text-left py-2 pr-2' }, '%1RM'),
            h('th', { class: 'text-left py-2 pr-2' }, 'RIR (0–5)'),
            h('th', { class: 'text-left py-2 pr-2' }, 'Velocidad (m/s)'),
            h('th', {})
          ])
        ]),
        tbody
      ])
    ]),
    h('div', { class: 'mt-4 flex flex-wrap gap-2' }, [
      button('+ añadir fila', () => { state.rows.push({ pct: '', rir: '', vm: '' }); persist(); render(container); }, { variant: 'secondary' }),
      button('Cargar ejemplo del manual', () => { state.rows = structuredClone(EJEMPLO); persist(); render(container); }, { variant: 'ghost' }),
      button('Limpiar datos', () => { state.rows = Array.from({ length: 6 }, () => ({ pct: '', rir: '', vm: '' })); state.ecuacion = null; persist(); render(container); }, { variant: 'ghost' }),
      button('Construir ecuación', () => construir(container), { variant: 'primary', icon: '🔧' })
    ]),
    state.ecuacion ? ecuacionResultado() : null
  ]);
}

function numInput(r, key, step, unit) {
  return h('div', { class: 'flex items-center gap-1' }, [
    h('input', {
      type: 'number', step, value: r[key],
      class: 'w-24 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 font-mono',
      oninput: (e) => { r[key] = e.target.value; persist(); }
    }),
    h('span', { class: 'text-xs text-slate-500' }, unit)
  ]);
}

function construir(container) {
  const points = state.rows
    .map(r => ({
      x: validateNumber(r.vm, { min: 0.05, max: 3 }),
      y: validateNumber(r.rir, { min: 0, max: 8 })
    }))
    .filter(p => p.x != null && p.y != null);
  if (points.length < 4) { showToast('Necesitas al menos 4 mediciones válidas.', 'error'); return; }

  let reg;
  try { reg = linearRegression(points); } catch (e) { showToast(e.message, 'error'); return; }
  state.ecuacion = {
    slope: reg.slope, intercept: reg.intercept, r2: reg.r2,
    equation: `RIR = ${reg.slope.toFixed(2)}·v + ${reg.intercept.toFixed(2)}`,
    vRange: [Math.min(...points.map(p => p.x)), Math.max(...points.map(p => p.x))],
    points
  };
  persist();
  render(container);
  if (reg.r2 < 0.60) showToast('Bondad de ajuste baja (R² < 0,60); considera medir más repeticiones o usar el modelo específico por carga.', 'warn', 6000);
  else showToast('Ecuación calibrada y guardada.', 'success');
}

function ecuacionResultado() {
  const e = state.ecuacion;
  const grid = h('div', { class: 'grid sm:grid-cols-3 gap-4 mt-5' }, [
    statCard('Pendiente m', formatDecimal(e.slope, 2),     { hint: 'Pendiente RIR/velocidad.', accent: 'indigo' }),
    statCard('Intercepto n', formatDecimal(e.intercept, 2),{ hint: 'RIR teórico para v=0.', accent: 'indigo' }),
    statCard('R²',           formatDecimal(e.r2, 3),       { hint: 'Aceptable si R² ≥ 0,60.', accent: e.r2 >= 0.60 ? 'emerald' : 'amber' })
  ]);
  const canvas = h('canvas', { class: 'block', height: 320 });
  const wrap = h('div', { class: 'relative h-[320px] mt-4' }, canvas);
  setTimeout(() => {
    chart = makeScatterWithRegression(canvas, {
      points: e.points,
      regressionFn: (v) => e.slope * v + e.intercept,
      regressionRange: [Math.max(0.05, e.vRange[0] * 0.9), e.vRange[1] * 1.1],
      xLabel: 'Velocidad media (m/s)',
      yLabel: 'RIR (reps)',
      xDecimals: 3, yDecimals: 1
    });
  }, 0);
  return h('div', {}, [
    h('div', { class: 'text-sm font-mono mt-5' }, e.equation),
    grid, wrap
  ]);
}

function computeView(container) {
  const e = state.ecuacion;
  if (!e) {
    return card([
      h('h2', { class: 'font-semibold text-lg mb-2' }, 'Sin ecuación calibrada'),
      h('p', { class: 'text-sm text-slate-500 mb-4' }, 'Primero calibra una ecuación individual en la pestaña anterior.'),
      button('Ir a Calibrar', () => { state.tab = 'calibrate'; persist(); render(container); }, { variant: 'primary' })
    ]);
  }
  const v = state.predV;
  const valid = validateNumber(v, { min: 0.05, max: 3 });
  let raw = null, shown = null, truncated = false, semaforo = '⚪', color = 'slate';
  if (valid != null) {
    raw = e.slope * valid + e.intercept;
    shown = Math.max(0, Math.min(8, raw));
    truncated = raw < 0 || raw > 8;
    if (shown >= 3)      { semaforo = '🟢'; color = 'emerald'; }
    else if (shown >= 1) { semaforo = '🟡'; color = 'amber'; }
    else                 { semaforo = '🔴'; color = 'rose'; }
  }
  const badgeColor = { emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
                       amber:   'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
                       rose:    'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
                       slate:   'bg-slate-100 dark:bg-slate-800' }[color];

  return card([
    h('h2', { class: 'font-semibold text-lg mb-3' }, 'Calcular RIR a partir de la velocidad'),
    h('div', { class: 'flex flex-col sm:flex-row gap-4 sm:items-end' }, [
      h('label', { class: 'flex flex-col gap-1 flex-1' }, [
        h('span', { class: 'text-xs uppercase text-slate-500' }, 'Velocidad media de la repetición (m/s)'),
        h('input', {
          type: 'number', step: '0.01', value: v,
          class: 'rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 font-mono text-lg',
          oninput: (ev) => { state.predV = ev.target.value; persist(); render(container); }
        })
      ]),
      h('div', { class: 'text-right' }, [
        h('div', { class: 'text-xs uppercase tracking-wider text-slate-500' }, 'RIR estimado'),
        h('div', { class: `inline-flex items-center gap-3 rounded-2xl px-5 py-3 ${badgeColor}` }, [
          h('span', { class: 'text-3xl' }, semaforo),
          h('span', { class: 'font-mono text-5xl font-bold tabular-nums' }, shown == null ? '—' : String(Math.round(shown)))
        ]),
        shown != null ? h('div', { class: 'text-xs text-slate-500 mt-1' }, `(exacto: ${formatDecimal(raw, 1)})`) : null
      ])
    ]),
    truncated ? h('p', { class: 'mt-4 text-sm text-amber-600 dark:text-amber-400' }, '⚠ El valor crudo cae fuera del rango [0, 8] y se ha truncado.') : null,
    h('div', { class: 'mt-5 text-xs text-slate-500 font-mono' }, `Ecuación: ${e.equation} · R²=${e.r2.toFixed(3)} · rango v ∈ [${e.vRange[0].toFixed(2)}, ${e.vRange[1].toFixed(2)}] m/s`)
  ]);
}

function persist() { store.set(KEY, state); }
