import { mapToObject } from '../../src/Shared/collectionHelpers'; 

describe('collectionHelpers.ts', () => {
  test('mapToObject should return object with map keys as object keys', async () => {
    // Arrange
    const testKey1: string = 'TEST_KEY1';
    const testKey2 = 'TEST_KEY2';
    const testKey3 = 'TEST_KEY3';
    const testValue = 'TEST_VALUE';
    const map: Map<string, string> = new Map([
      [testKey1, testValue],
      [testKey2, testValue],
      [testKey3, testValue],
    ]);

    // Act
    const object = mapToObject(map);
    const objectKeys = Object.keys(object);

    // Assert
    expect(objectKeys.length).toEqual(map.size);
    expect(object[testKey1]).toEqual(testValue);
    expect(object[testKey1]).toEqual(testValue);
    expect(object[testKey1]).toEqual(testValue);
  })
})
