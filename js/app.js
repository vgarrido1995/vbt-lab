/*
 * js/app.js
 * Bootstrap de VBT Lab.
 *  - Router por hash (#perfil, #rm, #esfuerzo, #mnr, #rir).
 *  - Toggle de tema (persistido en localStorage como vbt:theme).
 *  - Refresca gráficos Chart.js al cambiar tema.
 *  - Monta el módulo correspondiente y limpia los gráficos previos.
 */
import { store } from './store.js';
import { destroyAll, refreshThemeAll } from './charts.js';

import * as perfil   from './modules/perfilMecanico.js';
import * as rm       from './modules/estimadorRM.js';
import * as esfuerzo from './modules/gradoEsfuerzo.js';
import * as mnr      from './modules/prediccionMNR.js';
import * as rir      from './modules/calculadoraRIR.js';
import * as refs     from './modules/referencias.js';

const ROUTES = {
  perfil:   { mount: perfil.mount,   label: 'Perfil C-V' },
  rm:       { mount: rm.mount,       label: 'Estimador 1RM' },
  esfuerzo: { mount: esfuerzo.mount, label: 'Grado de esfuerzo' },
  mnr:      { mount: mnr.mount,      label: 'Predicción MNR' },
  rir:      { mount: rir.mount,      label: 'Calculadora RIR' },
  refs:     { mount: refs.mount,     label: 'Referencias' }
};

const app = document.getElementById('app');

function currentRoute() {
  const id = (location.hash || '#perfil').replace(/^#/, '');
  return ROUTES[id] ? id : 'perfil';
}

function highlightNav(id) {
  document.querySelectorAll('a.nav-link').forEach(a => {
    const active = a.dataset.route === id;
    a.classList.toggle('text-indigo-600', active);
    a.classList.toggle('dark:text-indigo-400', active);
    a.classList.toggle('bg-indigo-50', active);
    a.classList.toggle('dark:bg-indigo-900/30', active);
  });
}

function navigate() {
  const id = currentRoute();
  destroyAll();
  ROUTES[id].mount(app);
  highlightNav(id);
  document.title = `VBT Lab · ${ROUTES[id].label}`;
  // cerrar menú móvil
  document.getElementById('nav-mobile')?.classList.add('hidden');
}

// --- Tema ----------------------------------------------------------
function applyTheme(dark, persist = true) {
  document.documentElement.classList.toggle('dark', dark);
  if (persist) store.set('theme', dark ? 'dark' : 'light');
  // Refrescar gráficos para que adopten colores nuevos
  refreshThemeAll();
}

document.getElementById('theme-toggle').addEventListener('click', () => {
  const dark = !document.documentElement.classList.contains('dark');
  applyTheme(dark);
});

// Burger nav móvil
document.getElementById('nav-burger').addEventListener('click', () => {
  document.getElementById('nav-mobile').classList.toggle('hidden');
});

// Router
window.addEventListener('hashchange', navigate);
window.addEventListener('DOMContentLoaded', navigate);

// Si DOM ya estaba listo (módulos suelen cargarse después)
if (document.readyState !== 'loading') navigate();
