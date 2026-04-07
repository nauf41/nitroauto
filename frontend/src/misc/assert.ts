export function assert_nonnull<T>(value: T | null) {
  if (value === null) throw new Error("assert_nonnull failed. value: null");
  return value as T;
}

export function assert_nonnullish<T>(value: T | null | undefined) {
  if (value === null || value === undefined) throw new Error("assert_nonnullish failed. value: " + (value === null ? "null": "undefined"));
  return value as T;
}

export function unreachable(message?: string): never {
  throw new Error(`Unreachable code reached: ${message}`);
}