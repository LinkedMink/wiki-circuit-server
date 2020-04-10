import { Redis, Cluster } from "ioredis";
import { AgingCache, IAgingValue } from "./agingCache";
import { ISerializer, JsonSerializer } from "./serializer";

const DEFAULT_KEY_PREFIX = 'node';

export class TwoLevelRedisCache<TValue extends object> extends AgingCache<string, TValue> {
  private readonly client: Redis | Cluster;
  private readonly serializer: ISerializer<TValue>;
  private readonly keyPrefix: string;
  private readonly localCache: Map<string, IAgingValue<TValue>> = new Map();
  private readonly evictQueue: string[] = [];

  /**
   * @param client The Redis Client that has been initialized
   * @param serializer An implementation to serialize the cache value to/from strings or as JSON if not provided
   * @param keyPrefix A prefix to apply to the Redis keys to scope the entries in a shared environment
   * @param maxEntries The maximum number of entries to store in the cache, undefined for no max
   * @param maxAge The maximum time to keep entries in minutes
   * @param purgeInterval The interval to check for old entries in seconds
   */
  constructor(
    client: Redis | Cluster,
    serializer?: ISerializer<TValue>,
    keyPrefix?: string,
    maxEntries?: number,
    maxAge = 200,
    purgeInterval = 30) {

    super(maxEntries, maxAge, purgeInterval);

    this.client = client;
    if (serializer) {
      this.serializer = serializer;
    } else {
      this.serializer = new JsonSerializer<TValue>();
    }

    if (keyPrefix) {
      this.keyPrefix = keyPrefix;
    } else {
      this.keyPrefix = DEFAULT_KEY_PREFIX + Math.round(Math.random() * 1000000);
    }
  }

  public dispose(): void {
    super.dispose();

    const tempAllKeys = this.evictQueue.slice();
    for (let i = 0; i < tempAllKeys.length; i++) {
      this.delete(tempAllKeys[i]);
    }

    this.client.quit();
  }

  public get(key: string) {
    const localValue = this.localCache.get(key);
    if (localValue) {
      return localValue.data;
    }

    return this.client.get(key)
      .then((value) => {
        if (value) {
          return this.serializer.deserialize(value);
        }

        return null;
      }).catch(error => {
        return null
      });
  }

  public set(key: string, value: TValue) {
    const serializedValue = this.serializer.serialize(value);
    return this.client.set(key, serializedValue)
      .then((response) => {
        if (this.maxEntries && this.localCache.size >= this.maxEntries) {
          this.evict();
        }

        const cacheEntryTime = { time: Date.now(), data: value };
        this.localCache.set(key, cacheEntryTime);
        this.evictQueue.push(key);

        return true;
      }).catch(error => {
        return false;
      });
  }

  public delete(key: string) {
    return this.client.del(key)
      .then((response) => {
        if (response > 0) {
          this.localCache.delete(key);
          for (let i = 0; i < this.evictQueue.length; i++) {
            if (this.evictQueue[i] === key) {
              this.evictQueue.splice(i, 1);
            }
          }
          
          return true;
        }

        return false;
      }).catch(error => {
        return false
      });
  }

  public keys() {
    return this.client.keys(`${this.keyPrefix}*`)
      .catch(error => [] as string[]);
  }

  public purge() {
    let hasEntriesToEvict = this.evictQueue.length > 0;
    while (hasEntriesToEvict) {
      const nextKey = this.evictQueue[0];
      const nextEntry = this.localCache.get(nextKey);

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
      this.delete(nextKey);
      return true;
    }

    return false;
  }
}
