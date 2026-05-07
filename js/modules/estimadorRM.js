/*
 * js/modules/estimadorRM.js — Práctica 4
 * Estimador de 1RM por método de dos puntos.
 *
 * Modelo: L = a·v + b  (carga en función de velocidad).
 * 1RM = a·VML + b
 *
 * Validaciones:
 *   D1 = v_pesada - VML  →  debe ser ≤ 0,35 m/s
 *   D2 = v_ligera - v_pesada → debe estar en [0,40, 0,60] m/s
 *   v_ligera > v_pesada (obligatorio)
 *   v_pesada > VML       (obligatorio)
 */
import { h, clear, validateNumber, formatDecimal, showToast, statCard, button, moduleHeader, card, copyToClipboard, downloadDataUrl } from '../ui.js';
import { linearRegression } from '../stats.js';
import { store } from '../store.js';
import { makeScatterWithRegression, destroyChart } from '../charts.js';
import { EJERCICIOS, getEjercicio } from '../data/ejercicios.js';

const KEY = 'rm';
const EJEMPLO = {
  ejercicioId: 'press_banca_smith',
  vmlOverride: null,
  ligera: { kg: 40,  vm: 1.35 },
  pesada: { kg: 100, vm: 0.39 }
};

let state = {
  ejercicioId: 'press_banca_smith',
  vmlOverride: null,
  ligera: { kg: '', vm: '' },
  pesada: { kg: '', vm: '' },
  result: null
};
let chart = null;

export function mount(container) {
  state = store.get(KEY) || state;
  render(container);
}

function vmlActual() {
  if (state.vmlOverride != null && Number.isFinite(+state.vmlOverride)) return +state.vmlOverride;
  return getEjercicio(state.ejercicioId).vml;
}

function render(container) {
  clear(container);
  if (chart) { destroyChart(chart); chart = null; }

  container.appendChild(moduleHeader(
    'Estimador de 1RM (método de dos puntos)',
    'Práctica 4 · Con dos cargas distantes (≈40% y ≈85% 1RM) y sus velocidades medias se estima la 1RM proyectando hasta la velocidad mínima asociada al 1RM (VML) del ejercicio.'
  ));

  // Selector ejercicio + VML
  const vml = vmlActual();
  const isOverride = state.vmlOverride != null;
  const selectorBox = card([
    h('div', { class: 'flex flex-col sm:flex-row sm:items-end gap-4' }, [
      h('label', { class: 'flex flex-col gap-1 flex-1' }, [
        h('span', { class: 'text-xs uppercase tracking-wider text-slate-500' }, 'Ejercicio'),
        h('select', {
          class: 'rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2',
          onchange: (e) => { state.ejercicioId = e.target.value; state.vmlOverride = null; persist(); render(container); }
        }, EJERCICIOS.map(ex => h('option', { value: ex.id, selected: ex.id === state.ejercicioId ? 'selected' : null }, ex.nombre)))
      ]),
      h('div', { class: 'flex items-center gap-2' }, [
        h('div', {
          class: `inline-flex items-center gap-2 rounded-xl px-3 py-2 font-mono text-sm ${isOverride ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200' : 'bg-slate-100 dark:bg-slate-800'}`
        }, [
          h('span', {}, `VML = ${vml.toFixed(2)} m/s`),
          isOverride ? h('span', { class: 'text-[10px] uppercase font-semibold tracking-wider' }, 'personalizado') : null
        ]),
        button(isOverride ? 'Restaurar VML' : 'Editar VML', () => {
          if (isOverride) { state.vmlOverride = null; persist(); render(container); return; }
          const v = prompt('Introduce VML personalizada (m/s):', String(vml));
          const n = validateNumber(v, { min: 0.05, max: 1.5 });
          if (n == null) { showToast('VML inválida', 'error'); return; }
          state.vmlOverride = n; persist(); render(container);
        }, { variant: 'ghost' })
      ])
    ])
  ]);
  container.appendChild(selectorBox);

  // Cargas
  const cargas = card([
    h('h2', { class: 'font-semibold text-lg mb-3' }, 'Datos de las dos cargas'),
    h('div', { class: 'grid sm:grid-cols-2 gap-4' }, [
      bloqueCarga('Carga ligera (≈40% 1RM)', 'ligera', 'emerald'),
      bloqueCarga('Carga pesada (≈85% 1RM)', 'pesada', 'rose')
    ]),
    h('div', { class: 'mt-5 flex flex-wrap gap-2' }, [
      button('Cargar ejemplo del manual', () => {
        Object.assign(state, structuredClone(EJEMPLO));
        state.result = null; persist(); render(container);
      }, { variant: 'ghost' }),
      button('Limpiar datos', () => {
        state.ligera = { kg: '', vm: '' }; state.pesada = { kg: '', vm: '' }; state.result = null;
        persist(); render(container);
      }, { variant: 'ghost' }),
      button('Calcular 1RM', () => calcular(container), { variant: 'primary', icon: '🏋️' })
    ])
  ], 'mt-6');
  container.appendChild(cargas);

  if (state.result) container.appendChild(resultadosCard());
}

function bloqueCarga(titulo, key, accent) {
  const data = state[key];
  const accentMap = {
    emerald: 'border-emerald-200 dark:border-emerald-900',
    rose:    'border-rose-200 dark:border-rose-900'
  };
  return h('div', { class: `rounded-xl border ${accentMap[accent]} p-4 bg-slate-50 dark:bg-slate-800/40` }, [
    h('div', { class: 'font-semibold text-sm mb-3' }, titulo),
    h('div', { class: 'grid grid-cols-2 gap-3' }, [
      h('label', { class: 'flex flex-col gap-1' }, [
        h('span', { class: 'text-xs text-slate-500' }, 'Carga (kg)'),
        h('input', {
          type: 'number', step: '0.5', min: '0', value: data.kg,
          class: 'rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 font-mono',
          oninput: (e) => { data.kg = e.target.value; persist(); }
        })
      ]),
      h('label', { class: 'flex flex-col gap-1' }, [
        h('span', { class: 'text-xs text-slate-500' }, 'VM (m/s)'),
        h('input', {
          type: 'number', step: '0.01', min: '0.05', max: '3', value: data.vm,
          class: 'rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 font-mono',
          oninput: (e) => { data.vm = e.target.value; persist(); }
        })
      ])
    ])
  ]);
}

function calcular(container) {
  const lk = validateNumber(state.ligera.kg, { min: 0 });
  const lv = validateNumber(state.ligera.vm, { min: 0.05, max: 3 });
  const pk = validateNumber(state.pesada.kg, { min: 0 });
  const pv = validateNumber(state.pesada.vm, { min: 0.05, max: 3 });
  if ([lk, lv, pk, pv].some(v => v == null)) { showToast('Completa los 4 campos válidamente.', 'error'); return; }

  if (lv <= pv) { showToast('La velocidad de la carga ligera debe ser MAYOR que la de la pesada.', 'error'); return; }
  const vml = vmlActual();
  if (pv <= vml) { showToast('La carga pesada va por encima del 1RM teórico (v_pesada ≤ VML). Imposible.', 'error', 6000); return; }

  // L = a·v + b  →  regresión con x=v, y=L
  const reg = linearRegression([{ x: lv, y: lk }, { x: pv, y: pk }]);
  const oneRM = reg.slope * vml + reg.intercept;
  const pctPesada = (pk / oneRM) * 100;

  const D1 = pv - vml;       // distancia velocidad-pesada vs VML
  const D2 = lv - pv;        // separación entre las dos cargas
  const warns = [];
  if (D1 > 0.35) warns.push('La carga pesada está demasiado lejos del 1RM (D1 > 0,35 m/s). Aumenta la carga pesada para mejorar la fiabilidad.');
  if (D2 < 0.40 || D2 > 0.60) warns.push(`Diferencia de velocidades fuera del rango óptimo 0,40–0,60 m/s (D2 = ${D2.toFixed(2)}).`);

  state.result = {
    vml, oneRM, pctPesada, D1, D2,
    slope: reg.slope, intercept: reg.intercept, equation: `L = ${reg.slope.toFixed(2)}·v + ${reg.intercept.toFixed(2)}`,
    points: [{ x: lv, y: lk }, { x: pv, y: pk }],
    warns
  };
  persist();
  render(container);
  if (warns.length) warns.forEach(w => showToast(w, 'warn', 6000));
  else showToast('1RM estimado correctamente.', 'success');
}

function resultadosCard() {
  const r = state.result;
  const grid = h('div', { class: 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' }, [
    statCard('1RM estimado (kg)', formatDecimal(r.oneRM, 1), { hint: 'Carga proyectada en la velocidad mínima del ejercicio (VML).', accent: 'indigo' }),
    statCard('% que representó la pesada', formatDecimal(r.pctPesada, 1) + ' %', { hint: 'Idealmente cercano al 80–90%.', accent: 'emerald' }),
    statCard('Ecuación L–v', r.equation, { hint: 'Recta carga-velocidad ajustada con los 2 puntos.', accent: 'slate', mono: true })
  ]);

  const stats2 = h('div', { class: 'grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm' }, [
    h('div', { class: 'rounded-lg bg-slate-100 dark:bg-slate-800 p-3' }, [h('div', { class: 'text-xs text-slate-500' }, 'VML'), h('div', { class: 'font-mono' }, `${r.vml.toFixed(2)} m/s`)]),
    h('div', { class: 'rounded-lg bg-slate-100 dark:bg-slate-800 p-3' }, [h('div', { class: 'text-xs text-slate-500' }, 'D1'), h('div', { class: `font-mono ${r.D1 > 0.35 ? 'text-amber-500' : ''}` }, `${r.D1.toFixed(2)} m/s`)]),
    h('div', { class: 'rounded-lg bg-slate-100 dark:bg-slate-800 p-3' }, [h('div', { class: 'text-xs text-slate-500' }, 'D2'), h('div', { class: `font-mono ${(r.D2 < 0.40 || r.D2 > 0.60) ? 'text-amber-500' : ''}` }, `${r.D2.toFixed(2)} m/s`)]),
    h('div', { class: 'rounded-lg bg-slate-100 dark:bg-slate-800 p-3' }, [h('div', { class: 'text-xs text-slate-500' }, 'R²'), h('div', { class: 'font-mono' }, '1.000 (2 pts)')])
  ]);

  const canvas = h('canvas', { class: 'block', height: 360 });
  const wrap = h('div', { class: 'relative h-[360px] mt-4' }, canvas);

  const c = card([
    h('h2', { class: 'font-semibold text-lg mb-3' }, 'Resultados'),
    grid, stats2, wrap,
    h('div', { class: 'mt-4 flex flex-wrap gap-2 justify-end print:hidden' }, [
      button('📋 Copiar resumen', async () => {
        const ok = await copyToClipboard(resumenMD(r));
        showToast(ok ? 'Resumen copiado' : 'No se pudo copiar', ok ? 'success' : 'error');
      }, { variant: 'ghost' }),
      button('💾 Descargar PNG', () => { if (chart) downloadDataUrl(chart.toBase64Image(), '1rm.png'); }, { variant: 'ghost' })
    ])
  ], 'mt-6');

  setTimeout(() => {
    const xMin = Math.min(r.vml, ...r.points.map(p => p.x)) * 0.95;
    const xMax = Math.max(...r.points.map(p => p.x)) * 1.05;
    chart = makeScatterWithRegression(canvas, {
      points: r.points,
      regressionFn: (v) => r.slope * v + r.intercept,
      regressionRange: [xMin, xMax],
      xLabel: 'Velocidad media (m/s)',
      yLabel: 'Carga (kg)',
      title: 'Recta carga-velocidad y proyección a VML',
      xDecimals: 3, yDecimals: 1,
      markers: [{ x: r.vml, y: r.oneRM, label: '1RM' }]
    });
  }, 0);
  return c;
}

function resumenMD(r) {
  return [
    '# Estimación de 1RM (2 puntos)',
    `- **Ejercicio:** ${getEjercicio(state.ejercicioId).nombre}`,
    `- **VML:** ${r.vml.toFixed(2)} m/s`,
    `- **Carga ligera:** ${state.ligera.kg} kg @ ${state.ligera.vm} m/s`,
    `- **Carga pesada:** ${state.pesada.kg} kg @ ${state.pesada.vm} m/s`,
    `- **Ecuación:** ${r.equation}`,
    `- **1RM estimado:** ${r.oneRM.toFixed(1)} kg`,
    `- **% pesada vs 1RM:** ${r.pctPesada.toFixed(1)} %`,
    `- **D1:** ${r.D1.toFixed(2)} m/s · **D2:** ${r.D2.toFixed(2)} m/s`,
    r.warns.length ? '\n**Advertencias:**\n' + r.warns.map(w => `- ${w}`).join('\n') : ''
  ].join('\n');
}

function persist() { store.set(KEY, state); }
