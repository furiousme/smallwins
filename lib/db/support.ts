export function hasIndexedDB() {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

export function emitLocalStorageChange() {
  window.dispatchEvent(new Event("small-wins-storage"));
}
