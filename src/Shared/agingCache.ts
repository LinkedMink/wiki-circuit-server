export interface IAgingValue<T> {
  time: number;
  data: T;
}

/**
 * Exposes an interface for storing temporary values that need to be refreshed
 * at regular intervals.
 */
export abstract class AgingCache<TKey, TValue> implements IDisposable {
  private readonly _maxEntries?: number;
  private readonly _maxAge: number;
  private readonly _purgeInterval: number;
  private readonly _purgeTimer: NodeJS.Timeout;

  /**
   * @param maxEntries The maximum number of entries to store in the cache, undefined for no max
   * @param maxAge The maximum time to keep entries in minutes
   * @param purgeInterval The interval to check for old entries in seconds
   */
  constructor(
    maxEntries?: number,
    maxAge = 200,
    purgeInterval = 30) {
    
    this._maxEntries = maxEntries;
    this._maxAge = maxAge * 1000 * 60;
    this._purgeInterval = purgeInterval * 1000;

    if (maxEntries !== undefined && maxEntries < 1) {
      throw new Error(`maxEntries(${maxEntries}): must be greater than 0`);
    }

    if (this._maxAge <= this._purgeInterval) {
      throw new Error(`maxAge(${this._maxAge}): must be greater than purgeInterval(${this._purgeInterval})`);
    }

    if (purgeInterval < 10) {
      throw new Error(`purgeInterval(${purgeInterval}): must be greater than 10 seconds`);
    }

    this._purgeTimer = setInterval(this.purge.bind(this), this._purgeInterval);
  }

  public dispose(): void {
    clearInterval(this._purgeTimer);
  }

  /**
   * @param key The key to retrieve
   * @returns The value if it's in the cache or undefined
   */
  public abstract get(key: TKey): TValue | null | Promise<TValue | null>;

  /**
   * @param key The key to set
   * @param value The value to set
   * @returns If setting the value was successful
   */
  public abstract set(key: TKey, value: TValue): boolean | Promise<boolean>;

  /**
   * @param key The key to the value to delete
   * @returns If deleting the value was successful
   */
  public abstract delete(key: TKey): boolean | Promise<boolean>;

  /**
   * @returns The keys that are currently in the cache
   */
  public abstract keys(): TKey[] | Promise<TKey[]>;

  /**
   * Clear stale entries from the cache
   */
  public abstract purge(): void;

  /**
   * @returns The maximum number of entries to store in the cache, undefined for no max
   */
  public get maxEntries(): number | undefined {
    return this._maxEntries;
  }

  /**
   * @returns The maximum time to keep entries in milliseconds
   */
  public get maxAge(): number {
    return this._maxAge;
  }

  /**
   * @returns The interval to check for old entries in milliseconds
   */
  public get purgeInterval(): number {
    return this._purgeInterval;
  }
}
