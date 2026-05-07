/*
 * js/modules/perfilMecanico.js — Práctica 3
 * Perfil Mecánico Carga-Velocidad: regresión lineal v = a·L + v0 (a < 0).
 * Calcula v0, L0 = -v0/a, A_line = L0·v0/2, R².
 *
 * Cada fila admite uno o varios intentos de velocidad por carga (separados por
 * coma o espacio). Se usa la MEDIA de los intentos para el ajuste y se calcula
 * el coeficiente de variación (CV%) como bandera de calidad:
 *   CV ≤ 5 %  → 🟢 fiable
 *   5 < CV ≤ 10 % → 🟡 revisar
 *   CV > 10 %  → 🔴 descartar / repetir medición
 */
import { h, clear, validateNumber, formatDecimal, showToast, statCard, button, moduleHeader, card, copyToClipboard, downloadDataUrl } from '../ui.js';
import { linearRegression } from '../stats.js';
import { store } from '../store.js';
import { makeScatterWithRegression, destroyChart } from '../charts.js';

const KEY = 'perfil';

// EJEMPLO con varios intentos por carga (didáctico, deriva del manual UAL).
const EJEMPLO = [
  { carga: 14,  intentos: '1.47 1.45 1.49' },
  { carga: 40,  intentos: '1.32 1.30 1.34' },
  { carga: 65,  intentos: '1.13 1.10 1.15' },
  { carga: 90,  intentos: '0.92 0.90 0.94' },
  { carga: 115, intentos: '0.55 0.53 0.57' }
];

let state = { rows: [], result: null };
let chart = null;

export function mount(container) {
  state = store.get(KEY) || { rows: nuevasFilas(4), result: null, v: 2 };
  if (!state.rows || !state.rows.length) state.rows = nuevasFilas(4);
  // Migración v1 → v2: si el estado guardado venía con {carga, vm} (un único intento)
  // y coincide con el ejemplo antiguo del manual, lo reemplazamos por el nuevo
  // ejemplo con varios intentos para que el usuario pueda ver el CV.
  const eraEjemploAntiguo = state.v !== 2 && state.rows.length === EJEMPLO.length &&
    state.rows.every((r, i) => Number(r.carga) === EJEMPLO[i].carga &&
      Math.abs(Number(r.vm) - parseIntentos(EJEMPLO[i].intentos)[0]) < 1e-6);
  if (eraEjemploAntiguo) {
    state.rows = EJEMPLO.map(e => ({ carga: e.carga, intentos: e.intentos }));
    state.result = null;
  } else {
    state.rows = state.rows.map(r => r.intentos != null
      ? r
      : { carga: r.carga ?? '', intentos: r.vm != null && r.vm !== '' ? String(r.vm) : '' });
  }
  state.v = 2;
  persist();
  render(container);
}

function nuevasFilas(n) {
  return Array.from({ length: n }, () => ({ carga: '', intentos: '' }));
}

// ---------- Parseo y estadística por fila ----------
function parseIntentos(str) {
  if (str == null) return [];
  return String(str)
    .split(/[\s,;]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter(v => Number.isFinite(v) && v >= 0.05 && v <= 3);
}

function statsRow(intentos) {
  const n = intentos.length;
  if (!n) return { n: 0, mean: null, sd: 0, cv: null };
  const mean = intentos.reduce((s, v) => s + v, 0) / n;
  if (n < 2) return { n, mean, sd: 0, cv: 0 };
  const sd = Math.sqrt(intentos.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1));
  const cv = mean > 0 ? (sd / mean) * 100 : null;
  return { n, mean, sd, cv };
}

function cvBadge(cv) {
  if (cv == null) return null;
  let cls, icon, label;
  if (cv <= 5) { cls = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'; icon = '🟢'; label = 'fiable'; }
  else if (cv <= 10) { cls = 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'; icon = '🟡'; label = 'revisar'; }
  else { cls = 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'; icon = '🔴'; label = 'descartar'; }
  return h('span', { class: `inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${cls}` },
    `${icon} CV ${formatDecimal(cv, 1)} % · ${label}`);
}

// ---------- Render ----------
function render(container) {
  clear(container);
  if (chart) { destroyChart(chart); chart = null; }

  container.appendChild(moduleHeader(
    'Perfil mecánico carga-velocidad',
    'Práctica 3 · Introduce los pares (carga, intentos de velocidad) de una prueba incremental. Se usa la media de los intentos por carga para el ajuste y se evalúa la fiabilidad por coeficiente de variación (CV %).'
  ));

  const tbody = h('tbody', { class: 'divide-y divide-slate-200 dark:divide-slate-800' });
  state.rows.forEach((r, i) => tbody.appendChild(rowEl(r, i, container)));

  const tabla = card([
    h('h2', { class: 'font-semibold text-lg mb-1' }, 'Pares carga-velocidad'),
    h('p', { class: 'text-xs text-slate-500 dark:text-slate-400 mb-3' },
      'Para cada carga puedes anotar varios intentos separados por coma o espacio. La columna “Media · CV” se actualiza al calcular.'),
    h('div', { class: 'overflow-x-auto' }, [
      h('table', { class: 'w-full text-sm' }, [
        h('thead', { class: 'text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400' }, [
          h('tr', {}, [
            h('th', { class: 'text-left py-2 pr-2' }, '#'),
            h('th', { class: 'text-left py-2 pr-2' }, 'Carga (kg)'),
            h('th', { class: 'text-left py-2 pr-2' }, 'Intentos VM (m/s)'),
            h('th', { class: 'text-left py-2 pr-2' }, 'Media · CV'),
            h('th', { class: 'py-2' }, '')
          ])
        ]),
        tbody
      ])
    ]),
    h('div', { class: 'mt-4 flex flex-wrap gap-2' }, [
      button('+ añadir carga', () => { state.rows.push({ carga: '', intentos: '' }); persist(); render(container); }, { variant: 'secondary' }),
      button('Cargar ejemplo del manual', () => {
        state.rows = EJEMPLO.map(e => ({ carga: e.carga, intentos: e.intentos }));
        state.result = null; persist(); render(container);
      }, { variant: 'ghost' }),
      button('Limpiar datos', () => {
        state = { rows: nuevasFilas(4), result: null };
        persist(); render(container);
      }, { variant: 'ghost' }),
      button('Calcular perfil', () => calcular(container), { variant: 'primary', icon: '📈' })
    ])
  ]);
  container.appendChild(tabla);

  if (state.result) container.appendChild(resultadosCard());
}

function rowEl(r, i, container) {
  const stats = statsRow(parseIntentos(r.intentos));
  const meanCell = h('td', { class: 'py-2 pr-2 text-xs' }, [
    stats.mean != null
      ? h('div', { class: 'flex flex-col gap-1' }, [
          h('span', { class: 'font-mono text-sm' }, `x̄ = ${formatDecimal(stats.mean, 3)} m/s · n=${stats.n}`),
          stats.n >= 2 ? cvBadge(stats.cv) : h('span', { class: 'text-[11px] text-slate-400' }, '1 intento — sin CV')
        ])
      : h('span', { class: 'text-slate-400' }, '—')
  ]);

  const tr = h('tr', { class: 'hover:bg-slate-50 dark:hover:bg-slate-800/50 align-top' });
  tr.appendChild(h('td', { class: 'py-2 pr-2 text-slate-500' }, String(i + 1)));
  tr.appendChild(h('td', { class: 'py-2 pr-2' }, [
    h('input', {
      type: 'number', step: '0.5', min: '0', value: r.carga,
      class: 'w-24 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 font-mono',
      oninput: (e) => { r.carga = e.target.value; persist(); }
    })
  ]));
  tr.appendChild(h('td', { class: 'py-2 pr-2' }, [
    h('input', {
      type: 'text', value: r.intentos, placeholder: '1.10, 1.12, 1.08',
      class: 'w-56 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 font-mono',
      oninput: (e) => {
        r.intentos = e.target.value; persist();
        const newStats = statsRow(parseIntentos(r.intentos));
        meanCell.innerHTML = '';
        if (newStats.mean != null) {
          const wrap = h('div', { class: 'flex flex-col gap-1' }, [
            h('span', { class: 'font-mono text-sm' }, `x̄ = ${formatDecimal(newStats.mean, 3)} m/s · n=${newStats.n}`),
            newStats.n >= 2 ? cvBadge(newStats.cv) : h('span', { class: 'text-[11px] text-slate-400' }, '1 intento — sin CV')
          ]);
          meanCell.appendChild(wrap);
        } else {
          meanCell.appendChild(h('span', { class: 'text-slate-400' }, '—'));
        }
      }
    })
  ]));
  tr.appendChild(meanCell);
  tr.appendChild(h('td', { class: 'py-2 text-right' }, [
    h('button', {
      class: 'text-rose-500 hover:text-rose-400 text-sm',
      title: 'Eliminar fila',
      onclick: () => {
        state.rows.splice(i, 1);
        if (!state.rows.length) state.rows.push({ carga: '', intentos: '' });
        persist(); render(container);
      }
    }, '🗑')
  ]));
  return tr;
}

// ---------- Cálculo ----------
function calcular(container) {
  const filas = state.rows.map(r => {
    const carga = validateNumber(r.carga, { min: 0 });
    const intentos = parseIntentos(r.intentos);
    const s = statsRow(intentos);
    return { carga, intentos, ...s };
  });
  const validas = filas.filter(f => f.carga != null && f.mean != null);
  if (validas.length < 2) { showToast('Necesitas al menos 2 cargas válidas con velocidad.', 'error'); return; }

  const points = validas.map(f => ({ x: f.carga, y: f.mean }));
  let reg;
  try { reg = linearRegression(points); }
  catch (e) { showToast(e.message, 'error'); return; }

  const v0 = reg.intercept;
  const a  = reg.slope;
  const valido = a < 0 && v0 > 0;
  const L0 = valido ? -v0 / a : null;
  const Aline = valido ? (L0 * v0) / 2 : null;
  const cvFlags = validas.map(f => ({ carga: f.carga, n: f.n, mean: f.mean, cv: f.cv }));
  const cvMax = Math.max(...cvFlags.map(f => f.cv ?? 0));

  state.result = {
    points, slope: a, intercept: v0, v0, L0, Aline, r2: reg.r2, valido,
    cvFlags, cvMax,
    equation: `v = ${a.toFixed(4)}·L + ${v0.toFixed(4)}`
  };
  persist(); render(container);

  if (!valido) showToast('Modelo no válido: la pendiente debe ser negativa y v₀ positivo.', 'error', 7000);
  else if (cvMax > 10) showToast(`Variabilidad alta entre intentos (CV máx ${cvMax.toFixed(1)} %). Repite las cargas marcadas en rojo.`, 'warn', 7000);
  else if (reg.r2 < 0.95) showToast('Linealidad débil (R² < 0,95); revisa puntos atípicos.', 'warn', 6000);
  else showToast('Perfil calculado correctamente.', 'success');
}

// ---------- Resultados ----------
function resultadosCard() {
  const r = state.result;
  const fmt = (v, d) => v == null || !Number.isFinite(v) ? '—' : formatDecimal(v, d);
  const grid = h('div', { class: 'grid sm:grid-cols-2 lg:grid-cols-4 gap-4' }, [
    statCard('v₀ (m/s)',        fmt(r.v0, 2),    { hint: 'Intercepto. Velocidad máxima teórica (capacidad de velocidad pura).', accent: 'indigo' }),
    statCard('L₀ (kg)',         fmt(r.L0, 1),    { hint: 'Carga máxima teórica = v₀/|a|. Solo válido con pendiente negativa.', accent: r.valido ? 'emerald' : 'rose' }),
    statCard('A_line (kg·m/s)', fmt(r.Aline, 1), { hint: 'Área bajo la línea = L₀·v₀/2. Índice global de rendimiento.',        accent: r.valido ? 'amber'   : 'rose' }),
    statCard('R²',              fmt(r.r2, 3),    { hint: 'Bondad de ajuste. Aceptable si R² ≥ 0,95.',                          accent: r.r2 >= 0.95 ? 'emerald' : 'rose' })
  ]);

  // Tabla de fiabilidad por carga
  const flagsRows = (r.cvFlags || []).map(f => h('tr', { class: 'border-t border-slate-200 dark:border-slate-800' }, [
    h('td', { class: 'py-1.5 pr-3 font-mono' }, `${f.carga} kg`),
    h('td', { class: 'py-1.5 pr-3 font-mono' }, `n = ${f.n}`),
    h('td', { class: 'py-1.5 pr-3 font-mono' }, `x̄ = ${formatDecimal(f.mean, 3)}`),
    h('td', { class: 'py-1.5' }, f.n >= 2 ? cvBadge(f.cv) : h('span', { class: 'text-[11px] text-slate-400' }, '—'))
  ]));
  const flagsBlock = (r.cvFlags && r.cvFlags.length) ? h('div', { class: 'mt-5' }, [
    h('h3', { class: 'font-semibold text-sm mb-2' }, 'Fiabilidad por carga (CV %)'),
    h('table', { class: 'w-full text-sm' }, [
      h('tbody', {}, flagsRows)
    ]),
    h('p', { class: 'text-[11px] text-slate-500 dark:text-slate-400 mt-2' },
      'Umbrales orientativos: 🟢 CV ≤ 5 % · 🟡 5–10 % · 🔴 > 10 % (Banyard et al., 2017; Pérez-Castilla et al., 2019).')
  ]) : null;

  const canvas = h('canvas', { class: 'block', height: 360 });
  const wrap = h('div', { class: 'relative h-[360px] mt-4' }, canvas);

  const acciones = h('div', { class: 'mt-4 flex flex-wrap gap-2 justify-end print:hidden' }, [
    button('📋 Copiar resumen', async () => {
      const ok = await copyToClipboard(resumenMD(r));
      showToast(ok ? 'Resumen copiado' : 'No se pudo copiar', ok ? 'success' : 'error');
    }, { variant: 'ghost' }),
    button('💾 Descargar PNG', () => {
      if (chart) downloadDataUrl(chart.toBase64Image(), 'perfil-cv.png');
    }, { variant: 'ghost' })
  ]);

  const c = card([
    h('h2', { class: 'font-semibold text-lg mb-3' }, 'Resultados'),
    grid,
    h('div', { class: 'mt-5 text-sm font-mono text-slate-600 dark:text-slate-300' }, `Ecuación: ${r.equation}`),
    wrap,
    flagsBlock,
    acciones
  ], 'mt-6');

  setTimeout(() => {
    const xMax = (r.valido ? Math.max(r.L0, ...r.points.map(p => p.x)) : Math.max(...r.points.map(p => p.x))) * 1.05;
    chart = makeScatterWithRegression(canvas, {
      points: r.points,
      regressionFn: (x) => r.slope * x + r.intercept,
      regressionRange: [0, xMax],
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
  const lines = [
    '# Perfil mecánico C-V',
    '',
    '| Carga (kg) | n | x̄ VM (m/s) | CV (%) |',
    '|---:|---:|---:|---:|',
    ...(r.cvFlags || []).map(f => `| ${f.carga} | ${f.n} | ${f.mean.toFixed(3)} | ${f.cv == null ? '—' : f.cv.toFixed(1)} |`),
    '',
    `- **Ecuación:** ${r.equation}`,
    `- **v₀:** ${r.v0.toFixed(2)} m/s`,
    `- **L₀:** ${r.L0 == null ? '— (modelo no válido)' : r.L0.toFixed(1) + ' kg'}`,
    `- **A_line:** ${r.Aline == null ? '— (modelo no válido)' : r.Aline.toFixed(1) + ' kg·m/s'}`,
    `- **R²:** ${r.r2.toFixed(3)}`,
    `- **CV máx entre cargas:** ${r.cvMax == null ? '—' : r.cvMax.toFixed(1) + ' %'}`
  ];
  return lines.join('\n');
}
