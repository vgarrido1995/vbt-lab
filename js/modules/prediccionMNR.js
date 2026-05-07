/*
 * js/modules/prediccionMNR.js — Práctica 6
 * Predicción del Máximo Número de Repeticiones (MNR) en función de la velocidad
 * de la 1ª (o más rápida) repetición de la serie.
 *
 * Modo A — Construir ecuación: el atleta aporta 2-3 series al fallo (carga %1RM,
 * MNR observado, velocidad rep más rápida). Ajusta MNR = m·v + n y guarda en
 * localStorage como "perfil MNR del atleta".
 * Modo B — Predecir: con la ecuación guardada y una nueva v_1ª se devuelve el MNR.
 */
import { h, clear, validateNumber, formatDecimal, showToast, statCard, button, moduleHeader, card, copyToClipboard, downloadDataUrl } from '../ui.js';
import { linearRegression } from '../stats.js';
import { store } from '../store.js';
import { makeScatterWithRegression, destroyChart } from '../charts.js';

const KEY = 'mnr';
const EJEMPLO = [
  { pct: 65, mnr: 18, vmax: 0.65 },
  { pct: 75, mnr: 13, vmax: 0.55 },
  { pct: 85, mnr: 6,  vmax: 0.33 }
];

let state = {
  tab: 'build',
  rows: [{ pct: '', mnr: '', vmax: '' }, { pct: '', mnr: '', vmax: '' }, { pct: '', mnr: '', vmax: '' }],
  ecuacion: null,           // {slope, intercept, r2, vRange:[min,max], equation}
  predV: ''                 // input modo B
};
let chart = null;

export function mount(container) {
  state = store.get(KEY) || state;
  render(container);
}

function render(container) {
  clear(container);
  if (chart) { destroyChart(chart); chart = null; }
  container.appendChild(moduleHeader(
    'Predicción del MNR (Máximo Nº de Repeticiones)',
    'Práctica 6 · La velocidad de la repetición más rápida de una serie predice el número máximo de reps que se podrían completar al fallo.'
  ));

  // Tabs
  const tabs = h('div', { class: 'inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-4' }, [
    tabBtn('Construir ecuación', 'build', container),
    tabBtn('Predecir',            'predict', container)
  ]);
  container.appendChild(tabs);

  if (state.tab === 'build') container.appendChild(buildView(container));
  else container.appendChild(predictView(container));
}

function tabBtn(label, id, container) {
  const active = state.tab === id;
  return h('button', {
    class: `px-4 py-1.5 text-sm font-semibold rounded-lg transition ${active ? 'bg-white dark:bg-slate-900 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`,
    onclick: () => { state.tab = id; persist(); render(container); }
  }, label);
}

function buildView(container) {
  const tbody = h('tbody', { class: 'divide-y divide-slate-200 dark:divide-slate-800' });
  state.rows.forEach((r, i) => {
    tbody.appendChild(h('tr', { class: 'hover:bg-slate-50 dark:hover:bg-slate-800/50' }, [
      h('td', { class: 'py-2 pr-2 text-slate-500' }, String(i + 1)),
      h('td', { class: 'py-2 pr-2' }, [numInput(r, 'pct', '0.5', '%')]),
      h('td', { class: 'py-2 pr-2' }, [numInput(r, 'mnr', '1', 'reps')]),
      h('td', { class: 'py-2 pr-2' }, [numInput(r, 'vmax', '0.01', 'm/s')]),
      h('td', { class: 'py-2 text-right' }, [
        h('button', {
          class: 'text-rose-500 hover:text-rose-400 text-sm', title: 'Eliminar',
          onclick: () => { state.rows.splice(i, 1); if (!state.rows.length) state.rows.push({ pct: '', mnr: '', vmax: '' }); persist(); render(container); }
        }, '🗑')
      ])
    ]));
  });

  const view = card([
    h('h2', { class: 'font-semibold text-lg mb-3' }, 'Series llevadas al fallo'),
    h('p', { class: 'text-sm text-slate-500 mb-3' }, 'Aporta 2 o 3 series con su %1RM, MNR observado y velocidad de la repetición más rápida.'),
    h('div', { class: 'overflow-x-auto' }, [
      h('table', { class: 'w-full text-sm' }, [
        h('thead', { class: 'text-xs uppercase tracking-wider text-slate-500' }, [
          h('tr', {}, [
            h('th', { class: 'text-left py-2 pr-2' }, '#'),
            h('th', { class: 'text-left py-2 pr-2' }, '%1RM'),
            h('th', { class: 'text-left py-2 pr-2' }, 'MNR observado'),
            h('th', { class: 'text-left py-2 pr-2' }, 'Velocidad rep + rápida (m/s)'),
            h('th', {})
          ])
        ]),
        tbody
      ])
    ]),
    h('div', { class: 'mt-4 flex flex-wrap gap-2' }, [
      button('+ añadir serie', () => { state.rows.push({ pct: '', mnr: '', vmax: '' }); persist(); render(container); }, { variant: 'secondary' }),
      button('Cargar ejemplo del manual', () => { state.rows = structuredClone(EJEMPLO); persist(); render(container); }, { variant: 'ghost' }),
      button('Limpiar datos', () => { state.rows = [{ pct: '', mnr: '', vmax: '' }, { pct: '', mnr: '', vmax: '' }, { pct: '', mnr: '', vmax: '' }]; state.ecuacion = null; persist(); render(container); }, { variant: 'ghost' }),
      button('Construir y guardar ecuación', () => construir(container), { variant: 'primary', icon: '🔧' })
    ]),
    state.ecuacion ? ecuacionResultado() : null
  ]);
  return view;
}

function numInput(r, key, step, unit) {
  return h('div', { class: 'flex items-center gap-1' }, [
    h('input', {
      type: 'number', step, value: r[key],
      class: 'w-28 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 font-mono',
      oninput: (e) => { r[key] = e.target.value; persist(); }
    }),
    h('span', { class: 'text-xs text-slate-500' }, unit)
  ]);
}

function construir(container) {
  const points = state.rows
    .map(r => ({ x: validateNumber(r.vmax, { min: 0.05, max: 3 }), y: validateNumber(r.mnr, { min: 0 }) }))
    .filter(p => p.x != null && p.y != null);
  if (points.length < 2) { showToast('Se requieren al menos 2 series válidas.', 'error'); return; }

  let reg;
  try { reg = linearRegression(points); } catch (e) { showToast(e.message, 'error'); return; }

  state.ecuacion = {
    slope: reg.slope, intercept: reg.intercept, r2: reg.r2,
    equation: `MNR = ${reg.slope.toFixed(2)}·v + ${reg.intercept.toFixed(2)}`,
    vRange: [Math.min(...points.map(p => p.x)), Math.max(...points.map(p => p.x))],
    points
  };
  persist();
  render(container);
  showToast('Ecuación individual guardada en este navegador.', 'success');
}

function ecuacionResultado() {
  const e = state.ecuacion;
  const grid = h('div', { class: 'grid sm:grid-cols-3 gap-4 mt-5' }, [
    statCard('Pendiente m', formatDecimal(e.slope, 2),     { hint: 'Pendiente de la recta MNR-velocidad.', accent: 'indigo' }),
    statCard('Intercepto n', formatDecimal(e.intercept, 2),{ hint: 'MNR teórico para v=0.', accent: 'indigo' }),
    statCard('R²',           formatDecimal(e.r2, 3),       { hint: 'Bondad de ajuste de la recta.', accent: e.r2 >= 0.85 ? 'emerald' : 'amber' })
  ]);
  const canvas = h('canvas', { class: 'block', height: 320 });
  const wrap = h('div', { class: 'relative h-[320px] mt-4' }, canvas);
  setTimeout(() => {
    chart = makeScatterWithRegression(canvas, {
      points: e.points,
      regressionFn: (v) => e.slope * v + e.intercept,
      regressionRange: [Math.max(0.05, e.vRange[0] * 0.9), e.vRange[1] * 1.1],
      xLabel: 'Velocidad rep + rápida (m/s)',
      yLabel: 'MNR (reps)',
      xDecimals: 3, yDecimals: 1
    });
  }, 0);
  return h('div', {}, [
    h('div', { class: 'text-sm font-mono mt-5' }, e.equation),
    grid, wrap
  ]);
}

function predictView(container) {
  const e = state.ecuacion;
  if (!e) {
    return card([
      h('h2', { class: 'font-semibold text-lg mb-2' }, 'Predicción no disponible'),
      h('p', { class: 'text-sm text-slate-500 mb-4' }, 'Primero debes construir tu ecuación individual en la pestaña anterior.'),
      button('Ir a Construir ecuación', () => { state.tab = 'build'; persist(); render(container); }, { variant: 'primary' })
    ]);
  }
  const v = state.predV;
  const valid = validateNumber(v, { min: 0.05, max: 3 });
  let mnr = null, extrapolated = false, fallo = false;
  if (valid != null) {
    mnr = e.slope * valid + e.intercept;
    extrapolated = valid < e.vRange[0] - 1e-9 || valid > e.vRange[1] + 1e-9;
    fallo = mnr <= 0;
    if (fallo) mnr = 0;
  }
  return card([
    h('h2', { class: 'font-semibold text-lg mb-3' }, 'Predecir MNR para una nueva serie'),
    h('div', { class: 'flex flex-col sm:flex-row gap-4 sm:items-end' }, [
      h('label', { class: 'flex flex-col gap-1 flex-1' }, [
        h('span', { class: 'text-xs uppercase text-slate-500' }, 'Velocidad de la rep + rápida (m/s)'),
        h('input', {
          type: 'number', step: '0.01', value: v,
          class: 'rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 font-mono text-lg',
          oninput: (ev) => { state.predV = ev.target.value; persist(); render(container); }
        })
      ]),
      h('div', { class: 'text-right' }, [
        h('div', { class: 'text-xs uppercase tracking-wider text-slate-500' }, 'MNR estimado'),
        h('div', { class: 'font-mono text-6xl font-bold tabular-nums text-indigo-600 dark:text-indigo-400' }, mnr == null ? '—' : String(Math.max(0, Math.round(mnr)))),
        h('div', { class: 'text-xs text-slate-500 mt-1' }, mnr == null ? '' : `(${formatDecimal(mnr, 1)} reps exactas)`)
      ])
    ]),
    extrapolated ? h('p', { class: 'mt-4 text-sm text-amber-600 dark:text-amber-400' }, '⚠ Velocidad fuera del rango calibrado, predicción extrapolada — interpreta con cautela.') : null,
    fallo ? h('p', { class: 'mt-2 text-sm text-rose-600' }, '⛔ Velocidad demasiado baja: probablemente ya estás en fallo.') : null,
    h('div', { class: 'mt-5 text-xs text-slate-500 font-mono' }, `Ecuación activa: ${e.equation} · R²=${e.r2.toFixed(3)} · rango calibración v ∈ [${e.vRange[0].toFixed(2)}, ${e.vRange[1].toFixed(2)}] m/s`)
  ]);
}

function persist() { store.set(KEY, state); }
