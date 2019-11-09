interface AgingValue<T> {
  time: number;
  data: T
}

export class AgingCache<TKey, TValue> {
  constructor(
    maxEntries: number | undefined = undefined, 
    maxAge: number = 12000000, // 200 Min
    purgeInterval: number = 30000) { // 30 Sec

    if (maxEntries !== undefined && maxEntries < 1) {
      throw new Error(`maxEntries(${maxEntries}): must be greater than 0`);
    }

    if (maxAge <= purgeInterval) {
      throw new Error(`maxAge(${maxAge}): must be greater than purgeInterval(${purgeInterval})`);
    }

    if (purgeInterval < 10000) {
      throw new Error(`purgeInterval(${purgeInterval}): must be greater than 10 seconds`);
    }
    
    this.maxEntries = maxEntries;
    this.maxAge = maxAge;
    this.purgeInterval = purgeInterval;

    setInterval(this.purge, this.purgeInterval);
  }

  get = (key: TKey): TValue | undefined => {
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

    if (this.entries.has(key)) {
      this.entries.delete(key);
    }

    const cacheEntryTime = { time: Date.now(), data: value };
    this.entries.set(key, cacheEntryTime);
    this.evictQueue.push(key);
  }

  keys = () => {
    return this.evictQueue.slice();
  }

  delete = (id: TKey) => {
    this.entries.delete(id);
    for(let i = 0; i < this.evictQueue.length; i++) {
      if (this.evictQueue[i] === id) {
        this.evictQueue.splice(i, 1);
        return;
      }
    }
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