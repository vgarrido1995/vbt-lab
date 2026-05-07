/*
 * js/modules/gradoEsfuerzo.js — Práctica 5
 * Grado de esfuerzo: %Rep desde %PV vía regresión polinómica de grado 2.
 *
 * Para cada repetición i:
 *   %Rep_i = (i / N_total) · 100
 *   %PV_i  = (1 - v_i / v_max) · 100   (v_max = velocidad MÁXIMA observada)
 *
 * Modelamos %Rep = α·(%PV)² + β·(%PV) + γ.
 * NOTA TÉCNICA: el manual representa %PV en eje Y y %Rep en eje X. Aquí invertimos los
 * ejes porque la utilidad práctica de la herramienta es predecir el grado de esfuerzo
 * (%Rep) a partir del %PV observado en tiempo real durante la serie.
 */
import { h, clear, validateNumber, formatDecimal, showToast, statCard, button, moduleHeader, card, copyToClipboard, downloadDataUrl } from '../ui.js';
import { polynomialRegression2 } from '../stats.js';
import { store } from '../store.js';
import { makeScatterWithRegression, destroyChart } from '../charts.js';

const KEY = 'esfuerzo';
const EJEMPLO = [0.61,0.58,0.58,0.57,0.56,0.54,0.51,0.52,0.49,0.48,0.50,0.45,0.36,0.34,0.32];

let state = { reps: [], result: null, predictPV: 30 };
let chart = null;

export function mount(container) {
  state = store.get(KEY) || { reps: nuevasReps(5), result: null, predictPV: 30 };
  if (!state.reps?.length) state.reps = nuevasReps(5);
  render(container);
}

function nuevasReps(n) { return Array.from({ length: n }, () => ''); }

function render(container) {
  clear(container);
  if (chart) { destroyChart(chart); chart = null; }

  container.appendChild(moduleHeader(
    'Grado de esfuerzo (%Rep desde %PV)',
    'Práctica 5 · Introduce la velocidad media de cada repetición de una serie llevada al fallo. La app ajusta una curva cuadrática que predice el % de repeticiones realizadas desde el % de pérdida de velocidad.'
  ));

  // Tabla de reps
  const tbody = h('tbody', { class: 'divide-y divide-slate-200 dark:divide-slate-800' });
  state.reps.forEach((v, i) => {
    const tr = h('tr', { class: 'hover:bg-slate-50 dark:hover:bg-slate-800/50' }, [
      h('td', { class: 'py-2 pr-2 text-slate-500' }, `Rep ${i + 1}`),
      h('td', { class: 'py-2 pr-2' }, [
        h('input', {
          type: 'number', step: '0.01', min: '0.05', max: '3', value: v,
          class: 'w-32 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 font-mono',
          oninput: (e) => { state.reps[i] = e.target.value; persist(); }
        })
      ]),
      h('td', { class: 'py-2 text-right' }, [
        h('button', {
          class: 'text-rose-500 hover:text-rose-400 text-sm',
          title: 'Eliminar',
          onclick: () => {
            state.reps.splice(i, 1);
            if (!state.reps.length) state.reps.push('');
            persist(); render(container);
          }
        }, '🗑')
      ])
    ]);
    tbody.appendChild(tr);
  });

  container.appendChild(card([
    h('h2', { class: 'font-semibold text-lg mb-3' }, 'Repeticiones de la serie al fallo'),
    h('div', { class: 'overflow-x-auto' }, [
      h('table', { class: 'w-full text-sm' }, [
        h('thead', { class: 'text-xs uppercase tracking-wider text-slate-500' }, [
          h('tr', {}, [
            h('th', { class: 'text-left py-2 pr-2' }, '#'),
            h('th', { class: 'text-left py-2 pr-2' }, 'Velocidad (m/s)'),
            h('th', {})
          ])
        ]),
        tbody
      ])
    ]),
    h('div', { class: 'mt-4 flex flex-wrap gap-2' }, [
      button('+ añadir rep', () => { state.reps.push(''); persist(); render(container); }, { variant: 'secondary' }),
      button('Cargar ejemplo del manual', () => {
        state.reps = [...EJEMPLO];
        state.result = null; persist(); render(container);
      }, { variant: 'ghost' }),
      button('Limpiar datos', () => {
        state = { reps: nuevasReps(5), result: null, predictPV: 30 };
        persist(); render(container);
      }, { variant: 'ghost' }),
      button('Calcular curva', () => calcular(container), { variant: 'primary', icon: '∫' })
    ])
  ]));

  if (state.result) container.appendChild(resultadosCard(container));
}

function calcular(container) {
  const vels = state.reps.map(r => validateNumber(r, { min: 0.05, max: 3 })).filter(v => v != null);
  if (vels.length < 4) { showToast('Necesitas al menos 4 repeticiones válidas.', 'error'); return; }
  const vmax = Math.max(...vels);
  const N = vels.length;
  const points = vels.map((v, i) => ({
    x: (1 - v / vmax) * 100,            // %PV
    y: ((i + 1) / N) * 100              // %Rep
  }));

  let reg;
  try { reg = polynomialRegression2(points); }
  catch (e) { showToast(e.message, 'error'); return; }

  state.result = {
    points, vmax, N,
    a: reg.a, b: reg.b, c: reg.c, r2: reg.r2,
    equation: `%Rep = ${reg.a.toFixed(4)}·(%PV)² + ${reg.b.toFixed(4)}·%PV + ${reg.c.toFixed(4)}`
  };
  persist();
  render(container);
  if (reg.r2 < 0.85) showToast('R² bajo (<0,85). Revisa la calidad de las repeticiones.', 'warn', 6000);
  else showToast('Curva ajustada correctamente.', 'success');
}

function resultadosCard(container) {
  const r = state.result;
  const grid = h('div', { class: 'grid sm:grid-cols-2 lg:grid-cols-4 gap-4' }, [
    statCard('α (cuadrático)', formatDecimal(r.a, 4), { hint: 'Coeficiente del término cuadrático.', accent: 'indigo' }),
    statCard('β (lineal)',    formatDecimal(r.b, 4), { hint: 'Coeficiente del término lineal.',    accent: 'indigo' }),
    statCard('γ (intercepto)',formatDecimal(r.c, 4), { hint: 'Constante.',                          accent: 'indigo' }),
    statCard('R²',            formatDecimal(r.r2, 3),{ hint: 'Bondad de ajuste de la cuadrática.',  accent: r.r2 >= 0.85 ? 'emerald' : 'amber' })
  ]);

  // Predictor en tiempo real
  const pvLabel = h('div', { class: 'text-xs uppercase tracking-wider text-slate-500' }, '%PV objetivo');
  const pvValue = h('div', { class: 'font-mono text-3xl tabular-nums' }, `${state.predictPV} %`);
  const repValue = h('div', { class: 'font-mono text-5xl font-bold tabular-nums text-indigo-600 dark:text-indigo-400' }, '');
  const slider = h('input', {
    type: 'range', min: '0', max: '60', step: '1', value: String(state.predictPV),
    class: 'w-full accent-indigo-600',
    oninput: (e) => {
      state.predictPV = +e.target.value;
      pvValue.textContent = `${state.predictPV} %`;
      repValue.textContent = `${formatDecimal(predict(state.predictPV), 1)} %`;
      persist();
    }
  });

  function predict(pv) {
    const v = r.a * pv * pv + r.b * pv + r.c;
    return Math.max(0, Math.min(100, v));
  }
  repValue.textContent = `${formatDecimal(predict(state.predictPV), 1)} %`;

  const predictor = h('div', { class: 'mt-6 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-900/20 p-5' }, [
    h('h3', { class: 'font-semibold mb-3' }, 'Predictor de %Rep en tiempo real'),
    h('div', { class: 'flex items-end justify-between mb-2' }, [
      h('div', {}, [pvLabel, pvValue]),
      h('div', { class: 'text-right' }, [
        h('div', { class: 'text-xs uppercase tracking-wider text-slate-500' }, '%Rep estimado'),
        repValue
      ])
    ]),
    slider
  ]);

  const canvas = h('canvas', { class: 'block', height: 360 });
  const wrap = h('div', { class: 'relative h-[360px] mt-4' }, canvas);

  const c = card([
    h('h2', { class: 'font-semibold text-lg mb-3' }, 'Curva ajustada'),
    h('div', { class: 'text-sm font-mono text-slate-600 dark:text-slate-300 mb-3' }, r.equation),
    grid, wrap, predictor,
    h('div', { class: 'mt-4 flex flex-wrap gap-2 justify-end print:hidden' }, [
      button('📋 Copiar resumen', async () => {
        const ok = await copyToClipboard(resumenMD(r));
        showToast(ok ? 'Resumen copiado' : 'No se pudo copiar', ok ? 'success' : 'error');
      }, { variant: 'ghost' }),
      button('💾 Descargar PNG', () => { if (chart) downloadDataUrl(chart.toBase64Image(), 'esfuerzo.png'); }, { variant: 'ghost' })
    ])
  ], 'mt-6');

  setTimeout(() => {
    chart = makeScatterWithRegression(canvas, {
      points: r.points,
      regressionFn: (x) => r.a * x * x + r.b * x + r.c,
      regressionRange: [0, Math.max(60, ...r.points.map(p => p.x)) * 1.05],
      xLabel: '% Pérdida de velocidad (%PV)',
      yLabel: '% Repeticiones realizadas (%Rep)',
      title: '%Rep en función de %PV',
      xDecimals: 1, yDecimals: 1
    });
  }, 0);
  return c;
}

function resumenMD(r) {
  return [
    '# Grado de esfuerzo (%Rep ↔ %PV)',
    `- **N reps:** ${r.N} · **v_max:** ${r.vmax.toFixed(2)} m/s`,
    `- **Ecuación:** ${r.equation}`,
    `- **R²:** ${r.r2.toFixed(3)}`
  ].join('\n');
}

function persist() { store.set(KEY, state); }
