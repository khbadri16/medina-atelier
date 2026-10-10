// Key-value storage adapter.
// In the browser it wraps localStorage (falling back to memory if storage is
// blocked, e.g. in private mode). Tests swap in a memory store.

export function memoryStorage() {
  const map = new Map();
  return {
    get: (key) => (map.has(key) ? map.get(key) : null),
    set: (key, value) => void map.set(key, value),
    remove: (key) => void map.delete(key),
  };
}

function browserStorage() {
  try {
    const probe = '__medina_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return {
      get: (key) => window.localStorage.getItem(key),
      set: (key, value) => {
        try {
          window.localStorage.setItem(key, value);
        } catch {
          /* quota exceeded: keep going in memory */
        }
      },
      remove: (key) => window.localStorage.removeItem(key),
    };
  } catch {
    return memoryStorage();
  }
}

let current = typeof window !== 'undefined' ? browserStorage() : memoryStorage();

export function getStorage() {
  return current;
}

export function setStorage(storage) {
  current = storage;
}

export function readJSON(key, fallback) {
  const raw = current.get(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  current.set(key, JSON.stringify(value));
}
