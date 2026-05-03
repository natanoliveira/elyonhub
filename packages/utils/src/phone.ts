export function formatPhoneBR(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
}

export function toE164(value: string, countryCode = '55'): string {
  const digits = value.replace(/\D/g, '')
  if (digits.startsWith(countryCode)) return `+${digits}`
  return `+${countryCode}${digits}`
}

export function validatePhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length === 10 || digits.length === 11
}
