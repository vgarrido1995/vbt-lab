/*
 * js/modules/perfilMecanico.js — Práctica 3
 * Perfil Mecánico Carga-Velocidad: regresión lineal v = -a·L + v0.
 * Calcula v0, L0 = v0/|a|, A_line = L0·v0/2, y R².
 */
import { h, clear, validateNumber, formatDecimal, showToast, statCard, button, moduleHeader, card, copyToClipboard, downloadDataUrl } from '../ui.js';
import { linearRegression } from '../stats.js';
import { store } from '../store.js';
import { makeScatterWithRegression, destroyChart } from '../charts.js';

const KEY = 'perfil';
const EJEMPLO = [
  { carga: 14,  vm: 1.47 },
  { carga: 40,  vm: 1.32 },
  { carga: 65,  vm: 1.13 },
  { carga: 90,  vm: 0.92 },
  { carga: 115, vm: 0.55 }
];

let state = { rows: [], result: null };
let chart = null;

export function mount(container) {
  state = store.get(KEY) || { rows: nuevasFilas(4), result: null };
  if (!state.rows || !state.rows.length) state.rows = nuevasFilas(4);

  render(container);
}

function nuevasFilas(n) {
  return Array.from({ length: n }, () => ({ carga: '', vm: '' }));
}

function render(container) {
  clear(container);
  if (chart) { destroyChart(chart); chart = null; }

  container.appendChild(moduleHeader(
    'Perfil mecánico carga-velocidad',
    'Práctica 3 · Introduce los pares (carga, velocidad media) de una prueba de carga incremental para obtener v₀, L₀, A_line y R² del perfil individual.'
  ));

  // ============ Tabla editable ============
  const tbody = h('tbody', { class: 'divide-y divide-slate-200 dark:divide-slate-800' });
  state.rows.forEach((r, i) => tbody.appendChild(rowEl(r, i)));

  const tabla = card([
    h('h2', { class: 'font-semibold text-lg mb-3' }, 'Pares carga-velocidad'),
    h('div', { class: 'overflow-x-auto' }, [
      h('table', { class: 'w-full text-sm' }, [
        h('thead', { class: 'text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400' }, [
          h('tr', {}, [
            h('th', { class: 'text-left py-2 pr-2' }, '#'),
            h('th', { class: 'text-left py-2 pr-2' }, 'Carga (kg)'),
            h('th', { class: 'text-left py-2 pr-2' }, 'Velocidad media (m/s)'),
            h('th', { class: 'py-2' }, '')
          ])
        ]),
        tbody
      ])
    ]),
    h('div', { class: 'mt-4 flex flex-wrap gap-2' }, [
      button('+ añadir carga', () => { state.rows.push({ carga: '', vm: '' }); persist(); render(container); }, { variant: 'secondary' }),
      button('Cargar ejemplo del manual', () => {
        state.rows = EJEMPLO.map(e => ({ carga: e.carga, vm: e.vm }));
        state.result = null;
        persist(); render(container);
      }, { variant: 'ghost' }),
      button('Limpiar datos', () => {
        state = { rows: nuevasFilas(4), result: null };
        persist(); render(container);
      }, { variant: 'ghost' }),
      button('Calcular perfil', () => calcular(container), { variant: 'primary', icon: '📈' })
    ])
  ]);
  container.appendChild(tabla);

  // ============ Resultados ============
  if (state.result) container.appendChild(resultadosCard(container));
}

function rowEl(r, i) {
  const tr = h('tr', { class: 'hover:bg-slate-50 dark:hover:bg-slate-800/50' });
  tr.appendChild(h('td', { class: 'py-2 pr-2 text-slate-500' }, String(i + 1)));
  tr.appendChild(h('td', { class: 'py-2 pr-2' }, [
    h('input', {
      type: 'number', step: '0.5', min: '0', value: r.carga,
      class: 'w-32 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 font-mono',
      oninput: (e) => { r.carga = e.target.value; persist(); }
    })
  ]));
  tr.appendChild(h('td', { class: 'py-2 pr-2' }, [
    h('input', {
      type: 'number', step: '0.01', min: '0.05', max: '3', value: r.vm,
      class: 'w-32 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 font-mono',
      oninput: (e) => { r.vm = e.target.value; persist(); }
    })
  ]));
  tr.appendChild(h('td', { class: 'py-2 text-right' }, [
    h('button', {
      class: 'text-rose-500 hover:text-rose-400 text-sm',
      title: 'Eliminar fila',
      onclick: () => {
        state.rows.splice(i, 1);
        if (!state.rows.length) state.rows.push({ carga: '', vm: '' });
        persist();
        const container = document.getElementById('app');
        render(container);
      }
    }, '🗑')
  ]));
  return tr;
}

function calcular(container) {
  const points = state.rows
    .map(r => ({ x: validateNumber(r.carga, { min: 0 }), y: validateNumber(r.vm, { min: 0.05, max: 3 }) }))
    .filter(p => p.x != null && p.y != null);

  if (points.length < 2) { showToast('Necesitas al menos 2 pares válidos.', 'error'); return; }

  let reg;
  try { reg = linearRegression(points); }
  catch (e) { showToast(e.message, 'error'); return; }

  // Modelo: v = slope·L + intercept ; pendiente debe ser negativa
  const v0 = reg.intercept;
  const a  = reg.slope;
  const valido = a < 0 && v0 > 0;
  const L0 = valido ? -v0 / a : null; // = v0 / |a| cuando a<0
  const Aline = valido ? (L0 * v0) / 2 : null;
  state.result = {
    points, slope: a, intercept: v0, v0, L0, Aline, r2: reg.r2, valido,
    equation: `v = ${a.toFixed(4)}·L + ${v0.toFixed(4)}`
  };
  persist();
  render(container);

  if (!valido) showToast('Modelo no válido: la pendiente debe ser negativa y v₀ positivo. Revisa los datos (¿velocidad decreciente con la carga?).', 'error', 7000);
  else if (reg.r2 < 0.95) showToast('Linealidad débil (R² < 0,95); revisa puntos atípicos o repite la medición.', 'warn', 6000);
  else showToast('Perfil calculado correctamente.', 'success');
}

function resultadosCard(container) {
  const fmt = (v, d) => v == null || !Number.isFinite(v) ? '—' : formatDecimal(v, d);
  const grid = h('div', { class: 'grid sm:grid-cols-2 lg:grid-cols-4 gap-4' }, [
    statCard('v₀ (m/s)',          fmt(r.v0, 2),    { hint: 'Intercepto eje Y. Velocidad máxima teórica — capacidad de velocidad pura.', accent: 'indigo' }),
    statCard('L₀ (kg)',           fmt(r.L0, 1),    { hint: 'Carga máxima teórica = v₀/|a|. Solo válido si la pendiente es negativa.',  accent: r.valido ? 'emerald' : 'rose' }),
    statCard('A_line (kg·m/s)',   fmt(r.Aline, 1), { hint: 'Área bajo la línea = L₀·v₀/2. Índice global del rendimiento mecánico.',     accent: r.valido ? 'amber'   : 'rose' }),
    statCard('R²',                fmt(r.Aline, 1), { hint: 'Área bajo la línea = L₀·v₀/2. Índice global del rendimiento mecánico.',     accent: 'amber' }),
    statCard('R²',                formatDecimal(r.r2, 3),    { hint: 'Bondad de ajuste. Aceptable si R² ≥ 0,95.',                                accent: r.r2 >= 0.95 ? 'emerald' : 'rose' })
  ]);

  const canvas = h('canvas', { class: 'block', height: 360 });
  const wrap = h('div', { class: 'relative h-[360px] mt-4' }, canvas);

  const acciones = h('div', { class: 'mt-4 flex flex-wrap gap-2 justify-end print:hidden' }, [
    button('📋 Copiar resumen', async () => {
      const ok = await copyToClipboard(resumenMD(r));
      showToast(ok ? 'Resumen copiado' : 'No se pudo copiar', ok ? 'success' : 'error');
    }, { variant: 'ghost' }),
    button('💾 Descargar PNG', () => {
      if (!chart) return;
      downloadDataUrl(chart.toBase64Image(), 'perfil-cv.png');
    }, { variant: 'ghost' })
  ]);

  const c = card([
    h('h2', { class: 'font-semibold text-lg mb-3' }, 'Resultados'),
    grid,
    h('div', { class: 'mt-5 text-sm font-mono text-slate-600 dark:text-slate-300' }, `Ecuación: ${r.equation}`),
    wrap,
    acciones
  ], 'mt-6');

  // Pintamos el chart después de que el canvas esté en el DOM
  setonst xMax = (r.valido ? Math.max(r.L0, ...r.points.map(p => p.x)) : Math.max(...r.points.map(p => p.x))) * 1.05;
    chart = makeScatterWithRegression(canvas, {
      points: r.points,
      regressionFn: (x) => r.slope * x + r.intercept,
      regressionRange: [0, xMax
      regressionRange: [0, Math.max(r.L0, ...r.points.map(p => p.x)) * 1.05],
      xLabel: 'Carga (kg)',
      yLabel: 'Velocidad media (m/s)',
      title: 'Perfil mecánico carga-velocidad',
      xDecimals: 1, yDecimals: 3
    });
  }, 0);
  return c;
}

function persist() { store.set(KEY, state); }

function resumenMD(r) {
  return [
    '# Perfil mecánico C-V',
    '',
    '| Carga (kg) | VM (m/s) |',
    '|---:|---:|',
    ...r.points.map(p => `| ${p.x} | ${p.y.toFixed(3)} |`),
    '',
    `- **Ecuación:** ${r.equation}`,
    `- **v₀:** ${r.v0 == null ? '— (modelo no válido)' : r.L0.toFixed(1) + ' kg'}`,
    `- **A_line:** ${r.Aline == null ? '— (modelo no válido)' : r.Aline.toFixed(1) + ' kg·m/s'}
    `- **A_line:** ${r.Aline.toFixed(1)} kg·m/s`,
    `- **R²:** ${r.r2.toFixed(3)}`
  ].join('\n');
}
