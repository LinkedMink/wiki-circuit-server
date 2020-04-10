import { MemoryAgingCache } from "../../src/Shared/memoryAgingCache";

describe("MemoryAgingCache.ts", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("should check parameters are valid on create", () => {
    // Arrange
    const invalidMaxEntries = -1;
    const validMaxEntries = 10;
    const invalidMaxAge = 0.1;
    const validMaxAge = 1;
    const invalidPurgeInterval = 1;

    // Act -> Assert
    expect(() => {
      new MemoryAgingCache(invalidMaxEntries);
    }).toThrow();

    expect(() => {
      new MemoryAgingCache(validMaxEntries, invalidMaxAge);
    }).toThrow();

    expect(() => {
      new MemoryAgingCache(validMaxEntries, validMaxAge, invalidPurgeInterval);
    }).toThrow();
  });

  test("should be able to set and retrieve object from cache", () => {
    // Arrange
    const testKey = "TEST_KEY";
    const testValue = "TEST_VALUE";
    const cache: MemoryAgingCache<string, string> = new MemoryAgingCache();

    // Act
    cache.set(testKey, testValue);
    const retrieved = cache.get(testKey);

    // Assert
    expect(retrieved).toBe(testValue);
  });

  test("should be able to delete object from cache", () => {
    // Arrange
    const testKey = "TEST_KEY";
    const testValue = "TEST_VALUE";
    const cache: MemoryAgingCache<string, string> = new MemoryAgingCache();
    cache.set(testKey, testValue);

    // Act
    cache.delete(testKey);
    const retrieved = cache.get(testKey);

    // Assert
    expect(retrieved).toBeNull();
  });

  test("should evict entries if max exceeded", () => {
    // Arrange
    const testKey1 = "TEST_KEY1";
    const testKey2 = "TEST_KEY2";
    const testValue = "TEST_VALUE";
    const cache: MemoryAgingCache<string, string> = new MemoryAgingCache(1);

    // Act
    cache.set(testKey1, testValue);
    cache.set(testKey2, testValue);
    const retrieved1 = cache.get(testKey1);
    const retrieved2 = cache.get(testKey2);

    // Assert
    expect(retrieved1).toBeNull();
    expect(retrieved2).toBeDefined();
  });

  test("should evict entries if max age exceeded", () => {
    // Arrange
    jest.useFakeTimers();
    const testStartTime = 10000000;
    const testPurgeInterval = 60;
    const testPurgeIntervalMilliseconds = testPurgeInterval * 1000;
    const testKey = "TEST_KEY";
    const testValue = "TEST_VALUE";
    const cache: MemoryAgingCache<string, string> = new MemoryAgingCache(1, 1.000001, testPurgeInterval);
    jest
      .spyOn(global.Date, "now")
      .mockImplementationOnce(() => testStartTime);

    // Act
    cache.set(testKey, testValue);
    jest
      .spyOn(global.Date, "now")
      .mockImplementationOnce(() => testStartTime + testPurgeIntervalMilliseconds + 2);

    jest.advanceTimersByTime(testPurgeIntervalMilliseconds);
    const retrieved = cache.get(testKey);

    // Assert
    expect(retrieved).toBeNull();
  });

  test("should evict entries at a regular interval", () => {
    // Arrange
    jest.useFakeTimers();
    const testStartTime = 10000000;
    const testPurgeInterval = 60;
    const testPurgeIntervalMilliseconds = testPurgeInterval * 1000;
    const testKey1 = "TEST_KEY1";
    const testKey2 = "TEST_KEY2";
    const testValue = "TEST_VALUE";
    const cache: MemoryAgingCache<string, string> = new MemoryAgingCache(10, 1.000001, testPurgeInterval);

    // Act
    jest
      .spyOn(global.Date, "now")
      .mockImplementationOnce(() => testStartTime);
    cache.set(testKey1, testValue);

    jest
      .spyOn(global.Date, "now")
      .mockImplementationOnce(() => testStartTime + testPurgeIntervalMilliseconds);
    cache.set(testKey2, testValue);

    // Act/Assert 1
    jest
      .spyOn(global.Date, "now")
      .mockImplementationOnce(() => testStartTime + testPurgeIntervalMilliseconds + 2);
    jest.advanceTimersByTime(testPurgeIntervalMilliseconds);
    let retrieved1 = cache.get(testKey1);
    let retrieved2 = cache.get(testKey2);
    expect(retrieved1).toBeNull();
    expect(retrieved2).toBeDefined();

    jest
      .spyOn(global.Date, "now")
      .mockImplementationOnce(() => testStartTime + testPurgeIntervalMilliseconds * 2 + 2);
    jest.advanceTimersByTime(testPurgeIntervalMilliseconds * 2);
    retrieved1 = cache.get(testKey1);
    retrieved2 = cache.get(testKey2);

    // Assert Final
    expect(retrieved1).toBeNull();
    expect(retrieved2).toBeNull();
  });

  test("should list snapshot of keys", () => {
    // Arrange
    const testKey1 = "TEST_KEY1";
    const testKey2 = "TEST_KEY2";
    const testValue = "TEST_VALUE";
    const cache: MemoryAgingCache<string, string> = new MemoryAgingCache();

    // Act
    cache.set(testKey1, testValue);
    cache.set(testKey2, testValue);
    const keys1 = cache.keys();
    cache.delete(testKey1);
    const keys2 = cache.keys();

    // Assert
    expect(keys1.length).toEqual(2);
    expect(keys1.includes(testKey1)).toEqual(true);
    expect(keys1.includes(testKey2)).toEqual(true);
    expect(keys2.length).toEqual(1);
    expect(keys2.includes(testKey1)).toEqual(false);
    expect(keys2.includes(testKey2)).toEqual(true);
  });

  test("should allow replace with set()", () => {
    // Arrange
    const testKey = "TEST_KEY";
    const testValue1 = "TEST_VALUE1";
    const testValue2 = "TEST_VALUE2";
    const cache: MemoryAgingCache<string, string> = new MemoryAgingCache();

    // Act
    cache.set(testKey, testValue1);
    cache.set(testKey, testValue2);
    const retrieved = cache.get(testKey);

    // Assert
    expect(retrieved).toEqual(testValue2);
  });
});
