import { AgingCache } from '../../src/Shared/AgingCache'; 

describe('AgingCache.ts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  })

  test('should check parameters are valid on create', async () => {
    // Arrange
    const invalidMaxEntries = -1;
    const validMaxEntries = 10;
    const invalidMaxAge = 1000;
    const validMaxAge = 11000;
    const invalidPurgeInterval = 1000;

    // Act -> Assert
    expect(() => {
      const cache = new AgingCache(invalidMaxEntries);
      console.log(cache);
    }).toThrow()
    
    expect(() => {
      const cache = new AgingCache(validMaxEntries, invalidMaxAge);
      console.log(cache);
    }).toThrow()

    expect(() => {
      const cache = new AgingCache(validMaxEntries, validMaxAge, invalidPurgeInterval);
      console.log(cache);
    }).toThrow()
  })

  test('should be able to set and retrieve object from cache', async () => {
    // Arrange
    const testKey = 'TEST_KEY';
    const testValue = 'TEST_VALUE';
    const cache: AgingCache<string, string> = new AgingCache();

    // Act
    cache.set(testKey, testValue);
    const retrieved = cache.get(testKey);

    // Assert
    expect(retrieved).toBe(testValue);
  })

  test('should be able to delete object from cache', async () => {
    // Arrange
    const testKey = 'TEST_KEY';
    const testValue = 'TEST_VALUE';
    const cache: AgingCache<string, string> = new AgingCache();
    cache.set(testKey, testValue);

    // Act
    cache.delete(testKey);
    const retrieved = cache.get(testKey);

    // Assert
    expect(retrieved).toBeUndefined();
  })

  test('should evict entries if max exceeded', async () => {
    // Arrange
    const testKey1 = 'TEST_KEY1';
    const testKey2 = 'TEST_KEY2';
    const testValue = 'TEST_VALUE';
    const cache: AgingCache<string, string> = new AgingCache(1);

    // Act
    cache.set(testKey1, testValue);
    cache.set(testKey2, testValue);
    const retrieved1 = cache.get(testKey1);
    const retrieved2 = cache.get(testKey2);

    // Assert
    expect(retrieved1).toBeUndefined();
    expect(retrieved2).toBeDefined();
  })

  test('should evict entries if max age exceeded', async () => {
    // Arrange
    jest.useFakeTimers();
    const testStartTime = 10000000;
    const testPurgeInterval = 10000;
    const testKey = 'TEST_KEY';
    const testValue = 'TEST_VALUE';
    const cache: AgingCache<string, string> = new AgingCache(1, testPurgeInterval + 1, testPurgeInterval);
    jest
      .spyOn(global.Date, 'now')
      .mockImplementationOnce(() => testStartTime);

    // Act
    cache.set(testKey, testValue);
    jest
      .spyOn(global.Date, 'now')
      .mockImplementationOnce(() => testStartTime + testPurgeInterval + 2);

    jest.advanceTimersByTime(testPurgeInterval);
    const retrieved = cache.get(testKey);

    // Assert
    expect(retrieved).toBeUndefined();
  })

  test('should evict entries at a regular interval', async () => {
    // Arrange
    jest.useFakeTimers();
    const testStartTime = 10000000;
    const testPurgeInterval = 10000;
    const testKey1 = 'TEST_KEY1';
    const testKey2 = 'TEST_KEY2';
    const testValue = 'TEST_VALUE';
    const cache: AgingCache<string, string> = new AgingCache(10, testPurgeInterval + 1, testPurgeInterval);

    // Act
    jest
      .spyOn(global.Date, 'now')
      .mockImplementationOnce(() => testStartTime);
    cache.set(testKey1, testValue);

    jest
      .spyOn(global.Date, 'now')
      .mockImplementationOnce(() => testStartTime + testPurgeInterval);
    cache.set(testKey2, testValue);

    // Act/Assert 1
    jest
      .spyOn(global.Date, 'now')
      .mockImplementationOnce(() => testStartTime + testPurgeInterval + 2);
    jest.advanceTimersByTime(testPurgeInterval);
    let retrieved1 = cache.get(testKey1);
    let retrieved2 = cache.get(testKey2);
    expect(retrieved1).toBeUndefined();
    expect(retrieved2).toBeDefined();

    jest
      .spyOn(global.Date, 'now')
      .mockImplementationOnce(() => testStartTime + testPurgeInterval * 2 + 2);
    jest.advanceTimersByTime(testPurgeInterval * 2);
    retrieved1 = cache.get(testKey1);
    retrieved2 = cache.get(testKey2);

    // Assert Final
    expect(retrieved1).toBeUndefined();
    expect(retrieved2).toBeUndefined();
  })

  test('should list snapshot of keys', async () => {
    // Arrange
    const testKey1 = 'TEST_KEY1';
    const testKey2 = 'TEST_KEY2';
    const testValue = 'TEST_VALUE';
    const cache: AgingCache<string, string> = new AgingCache();

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
  })

  test('should allow replace with set()', async () => {
    // Arrange
    const testKey = 'TEST_KEY';
    const testValue1 = 'TEST_VALUE1';
    const testValue2 = 'TEST_VALUE2';
    const cache: AgingCache<string, string> = new AgingCache();

    // Act
    cache.set(testKey, testValue1);
    cache.set(testKey, testValue2);
    const retrieved = cache.get(testKey);

    // Assert
    expect(retrieved).toEqual(testValue2);
  })
})
