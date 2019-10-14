interface AgingValue<T> {
  time: number;
  data: T
}

export default class AgingCache<TKey, TValue> {
  constructor(
    maxEntries: number | undefined = undefined, 
    maxAge: number = 1000000, 
    purgeInterval: number = 10000) {
    this.maxEntries = maxEntries;
    this.maxAge = maxAge;
    this.purgeInterval = purgeInterval;

    setInterval(this.purge, purgeInterval);
  }

  get = (key: TKey): TValue | undefined => {
    if (!this.entries.has(key)) {
      return undefined;
    }

    const entry = this.entries.get(key);
    if (entry) {
      return entry.data;
    }
    
    return undefined;
  }

  set = (key: TKey, value: TValue) => {
    while (this.maxEntries && this.entries.size >= this.maxEntries) {
      this.evict();
    }

    const cacheEntryTime = { time: Date.now(), data: value };
    this.entries.set(key, cacheEntryTime);
    this.evictQueue.push(key);
  }

  private evict = () => {
    const nextKey = this.evictQueue.shift();
    if (nextKey) {
      this.entries.delete(nextKey);
    }
  }

  private purge = () => {
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

  private maxEntries: number | undefined;
  private maxAge: number;
  private purgeInterval: number;
  private entries: Map<TKey, AgingValue<TValue>> = new Map();
  private evictQueue: Array<TKey> = [];
}