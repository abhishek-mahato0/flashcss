export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number = 20) {
    this.cache = new Map<K, V>();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;

    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    this.cache.set(key, value);

    // Evict LRU if over max size
    if (this.cache.size > this.maxSize) {
      const lruKey = this.cache.keys().next().value;
      if (lruKey !== undefined) {
        this.cache.delete(lruKey);
      }
    }
  }

  delete(key: K): void {
    this.cache.delete(key);
  }
}
