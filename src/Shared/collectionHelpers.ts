export const mapToObject = <TValue>(map: Map<string | number, TValue>): { [key: string]: TValue; } => {
  const mapObject: { [key: string]: TValue; } = {};

  for (const [key, value] of map) {
    mapObject[key] = value;
  }

  return mapObject;
}