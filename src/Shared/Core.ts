export function isError(error: unknown): error is Error {
  return (error as Error).message !== undefined;
}

export function isArray<T>(array: unknown): array is Array<T> {
  return Array.isArray(array);
}

export function isString(toCheck: unknown): toCheck is string {
  return typeof toCheck === "string" || toCheck instanceof String;
}
