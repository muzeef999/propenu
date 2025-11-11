// simple in-memory cache with TTL
type CacheEntry<T> = { value: T; expiresAt: number };

export class TTLCache<K, V> {
  private store = new Map<K, CacheEntry<V>>();
  constructor(private ttlMs: number) {}

  get(key: K): V | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (Date.now() > hit.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
    }

  set(key: K, value: V) {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}
