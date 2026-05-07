/*
 * js/charts.js
 * Factory de gráficos Chart.js v4 con tema reactivo y línea de regresión.
 * Mantiene un registro de instancias activas para refrescarlas al alternar dark/light.
 */
const REGISTRY = new Set();

function themeColors() {
  const dark = document.documentElement.classList.contains('dark');
  return {
    text:    dark ? '#e2e8f0' : '#0f172a',
    grid:    dark ? '#1e293b' : '#e2e8f0',
    accent:  '#6366f1',
    accent2: '#f43f5e',
    point:   '#6366f1'
  };
}

function applyDefaults() {
  if (!window.Chart) return;
  const c = themeColors();
  Chart.defaults.font.family = 'Inter, ui-sans-serif, system-ui, sans-serif';
  Chart.defaults.color = c.text;
  Chart.defaults.borderColor = c.grid;
}

/**
 * Crea un scatter con línea de regresión opcional.
 * @param {HTMLCanvasElement} canvas
 * @param {object} opts
 *   - points: [{x,y}]
 *   - regressionFn: (x)=>y (opcional)
 *   - regressionRange: [xMin,xMax] (para extrapolar)
 *   - xLabel, yLabel, title
 *   - markers: array de {x,y,label} adicionales
 */
export function makeScatterWithRegression(canvas, opts) {
  applyDefaults();
  const c = themeColors();
  const datasets = [
    {
      type: 'scatter',
      label: opts.pointsLabel || 'Datos',
      data: opts.points,
      backgroundColor: c.point,
      borderColor: c.point,
      pointRadius: 6,
      pointHoverRadius: 8
    }
  ];
  if (typeof opts.regressionFn === 'function') {
    const [xMin, xMax] = opts.regressionRange || [
      Math.min(...opts.points.map(p => p.x)),
      Math.max(...opts.points.map(p => p.x))
    ];
    const N = 50;
    const line = [];
    for (let i = 0; i <= N; i++) {
      const x = xMin + ((xMax - xMin) * i) / N;
      line.push({ x, y: opts.regressionFn(x) });
    }
    datasets.push({
      type: 'line',
      label: opts.regressionLabel || 'Regresión',
      data: line,
      borderColor: c.accent2,
      borderDash: [6, 4],
      borderWidth: 2,
      pointRadius: 0,
      fill: false,
      tension: 0
    });
  }
  if (Array.isArray(opts.markers) && opts.markers.length) {
    datasets.push({
      type: 'scatter',
      label: 'Marcadores',
      data: opts.markers,
      backgroundColor: '#10b981',
      borderColor: '#065f46',
      pointStyle: 'rectRot',
      pointRadius: 9,
      pointHoverRadius: 11
    });
  }

  const chart = new Chart(canvas, {
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: opts.title ? { display: true, text: opts.title } : { display: false },
        legend: { display: datasets.length > 1, position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const x = Number(ctx.parsed.x);
              const y = Number(ctx.parsed.y);
              return `${ctx.dataset.label}: (${x.toFixed(opts.xDecimals ?? 2)}, ${y.toFixed(opts.yDecimals ?? 3)})`;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: opts.xLabel || 'X' },
          grid: { color: c.grid }
        },
        y: {
          title: { display: true, text: opts.yLabel || 'Y' },
          grid: { color: c.grid },
          beginAtZero: opts.yBeginAtZero ?? false
        }
      }
    }
  });
  REGISTRY.add(chart);
  return chart;
}

/** Refresca todos los gráficos activos cuando cambia el tema. */
export function refreshThemeAll() {
  applyDefaults();
  const c = themeColors();
  for (const chart of REGISTRY) {
    if (!chart || !chart.options) continue;
    if (chart.options.scales?.x?.grid) chart.options.scales.x.grid.color = c.grid;
    if (chart.options.scales?.y?.grid) chart.options.scales.y.grid.color = c.grid;
    chart.update('none');
  }
}

/** Limpia un chart concreto del registro y lo destruye. */
export function destroyChart(chart) {
  if (!chart) return;
  REGISTRY.delete(chart);
  chart.destroy();
}

/** Destruye todos (útil al cambiar de ruta). */
export function destroyAll() {
  for (const c of REGISTRY) c.destroy();
  REGISTRY.clear();
}
