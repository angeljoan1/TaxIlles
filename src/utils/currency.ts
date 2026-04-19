export function formatEuros(cents: number): string {
  return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

export function formatEurosShort(cents: number): string {
  return (cents / 100).toFixed(2) + ' €'
}

export function centsFromString(raw: string): number {
  return parseInt(raw || '0', 10)
}
