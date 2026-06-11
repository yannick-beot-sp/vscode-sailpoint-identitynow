
export function isNotEmpty<T>(arr: unknown): arr is [T, ...T[]] {
  return Array.isArray(arr) && arr.length > 0;
}

export function isEmpty(arr: unknown): arr is [] | Exclude<unknown, any[]> {
  return !Array.isArray(arr) || arr.length === 0;
}