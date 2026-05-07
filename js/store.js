/*
 * js/store.js
 * Wrapper de localStorage con namespacing 'vbt:<clave>'.
 * Serializa/deserializa JSON y maneja errores de cuota o navegación privada de forma silenciosa.
 */
const NS = 'vbt:';

export const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(NS + key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(NS + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try { localStorage.removeItem(NS + key); } catch {}
  },
  clear() {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(NS))
        .forEach(k => localStorage.removeItem(k));
    } catch {}
  }
};
