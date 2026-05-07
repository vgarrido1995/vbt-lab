/*
 * js/ui.js
 * Helpers de DOM, validación numérica, formateo y notificaciones (toasts).
 * Expuesto como funciones puras / utilitarias — sin estado global.
 */

/**
 * Crea un elemento DOM con atributos y descendientes.
 * children acepta strings, nodos y arrays anidados.
 */
export function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k in el && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v);
  }
  appendChildren(el, children);
  return el;
}

function appendChildren(el, children) {
  if (children == null) return;
  if (!Array.isArray(children)) children = [children];
  for (const c of children) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) appendChildren(el, c);
    else if (c instanceof Node) el.appendChild(c);
    else el.appendChild(document.createTextNode(String(c)));
  }
}

/** Atajo: limpia un contenedor */
export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/** Valida y devuelve número, o null si inválido. */
export function validateNumber(value, { min = -Infinity, max = Infinity } = {}) {
  if (value === '' || value == null) return null;
  const n = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  if (n < min || n > max) return null;
  return n;
}

/** Formato decimal con coma (locale es) y N decimales */
export function formatDecimal(n, decimals = 2) {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Toast no bloqueante. type: info|success|warn|error */
export function showToast(message, type = 'info', timeout = 4000) {
  const host = document.getElementById('toast');
  if (!host) return;
  const palette = {
    info:    'bg-slate-800 text-white',
    success: 'bg-emerald-600 text-white',
    warn:    'bg-amber-500 text-slate-900',
    error:   'bg-rose-600 text-white'
  }[type] || 'bg-slate-800 text-white';
  const icon = { info: 'ℹ️', success: '✅', warn: '⚠️', error: '⛔' }[type] || 'ℹ️';
  const node = h('div', {
    class: `${palette} px-4 py-2 rounded-xl shadow-lg text-sm flex items-start gap-2 max-w-xs animate-toast-in`,
    role: 'status'
  }, [h('span', {}, icon), h('span', {}, message)]);
  host.appendChild(node);
  setTimeout(() => {
    node.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => node.remove(), 300);
  }, timeout);
}

/** Copia texto al portapapeles con fallback. */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch {}
    ta.remove();
    return ok;
  }
}

/** Descarga un dataURL como archivo. */
export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
}

/** Plantilla rápida de tarjeta-resultado. */
export function statCard(label, value, { hint = '', mono = true, accent = 'indigo' } = {}) {
  const accentMap = {
    indigo:  'from-indigo-50 to-white dark:from-indigo-900/30 dark:to-slate-900',
    emerald: 'from-emerald-50 to-white dark:from-emerald-900/30 dark:to-slate-900',
    amber:   'from-amber-50 to-white dark:from-amber-900/30 dark:to-slate-900',
    rose:    'from-rose-50 to-white dark:from-rose-900/30 dark:to-slate-900',
    slate:   'from-slate-100 to-white dark:from-slate-800 dark:to-slate-900'
  };
  return h('div', {
    class: `rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br ${accentMap[accent] || accentMap.indigo} p-5 shadow-sm`,
    title: hint
  }, [
    h('div', { class: 'text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold' }, label),
    h('div', { class: `mt-2 ${mono ? 'font-mono' : ''} text-3xl sm:text-4xl font-bold tabular-nums` }, value),
    hint ? h('div', { class: 'mt-2 text-xs text-slate-500 dark:text-slate-400' }, hint) : null
  ]);
}

/** Botón estilizado primario o secundario. */
export function button(label, onClick, { variant = 'primary', icon = null, type = 'button', extra = '' } = {}) {
  const base = 'inline-flex items-center gap-2 font-semibold rounded-xl px-5 py-2.5 shadow-sm focus:outline-none focus:ring-2 transition';
  const styles = {
    primary:   'bg-indigo-600 hover:bg-indigo-500 text-white focus:ring-indigo-400',
    secondary: 'bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 focus:ring-slate-400',
    ghost:     'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-slate-400',
    danger:    'bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-400'
  };
  return h('button', {
    type,
    class: `${base} ${styles[variant] || styles.primary} ${extra}`,
    onclick: onClick
  }, [icon ? h('span', {}, icon) : null, label]);
}

/** Cabecera de módulo reutilizable. */
export function moduleHeader(title, subtitle) {
  return h('header', { class: 'mb-6' }, [
    h('h1', { class: 'text-2xl sm:text-3xl font-bold tracking-tight' }, title),
    subtitle ? h('p', { class: 'mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-3xl' }, subtitle) : null
  ]);
}

/** Tarjeta-contenedor genérica */
export function card(children, extra = '') {
  return h('section', {
    class: `rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-7 ${extra}`
  }, children);
}
