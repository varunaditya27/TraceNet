export function formatDistance(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '∞'
  return value.toFixed(3)
}

export function cloneMatrix(matrix: (number | null)[][]): (number | null)[][] {
  return matrix.map(row => [...row])
}
