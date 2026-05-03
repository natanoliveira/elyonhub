export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function parseBRL(str: string): number {
  const cleaned = str.replace(/[R$\s.]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}
