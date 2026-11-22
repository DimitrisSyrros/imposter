import { useEffect, useState } from "react";

// localStorage can be missing, full or blocked (private mode, disabled site data).
// Every read and write goes through here and fails quietly.

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

// useState that survives the phone reloading the page (browsers often do after the screen was off
// or another app was used). `id` ties the value to one round: a value saved for another round is ignored.
export function useSavedState(key, id, initial) {
  const [value, setValue] = useState(() => {
    const saved = load(key, null);
    return saved && saved.id === id ? saved.value : initial;
  });
  useEffect(() => save(key, { id, value }), [key, id, value]);
  return [value, setValue];
}
