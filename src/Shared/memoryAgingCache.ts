import { AgingCache, IAgingValue } from "./agingCache";

export class MemoryAgingCache<TKey, TValue> extends AgingCache<TKey, TValue> {
  private readonly entries: Map<TKey, IAgingValue<TValue>> = new Map();
  private readonly evictQueue: TKey[] = [];

  /**
   * @param maxEntries The maximum number of entries to store in the cache, undefined for no max
   * @param maxAge The maximum time to keep entries in minutes
   * @param purgeInterval The interval to check for old entries in seconds
   */
  constructor(
    maxEntries?: number,
    maxAge = 200,
    purgeInterval = 30) {

    super(maxEntries, maxAge, purgeInterval);
  }

  public get(key: TKey): TValue | null {
    const entry = this.entries.get(key);
    if (entry) {
      return entry.data;
    }

    return null;
  }

  public set(key: TKey, value: TValue) {
    while (this.maxEntries && this.entries.size >= this.maxEntries) {
      this.evict();
    }

    if (this.entries.has(key)) {
      this.entries.delete(key);
    }

    const cacheEntryTime = { time: Date.now(), data: value };
    this.entries.set(key, cacheEntryTime);
    this.evictQueue.push(key);
    return true;
  }

  public delete(key: TKey) {
    this.entries.delete(key);
    for (let i = 0; i < this.evictQueue.length; i++) {
      if (this.evictQueue[i] === key) {
        this.evictQueue.splice(i, 1);
        return true;
      }
    }

    return false;
  }

  public keys() {
    return this.evictQueue.slice();
  }

  public purge() {
    let hasEntriesToEvict = this.evictQueue.length > 0;
    while (hasEntriesToEvict) {
      const nextKey = this.evictQueue[0];
      const nextEntry = this.entries.get(nextKey);

      if (nextEntry && nextEntry.time + this.maxAge < Date.now()) {
        this.evict();
      } else {
        hasEntriesToEvict = false;
      }
    }
  }

  private evict() {
    const nextKey = this.evictQueue.shift();
    if (nextKey) {
      this.entries.delete(nextKey);
    }
  }
}
