export function maskAccountNumber(value: string) {
  if (value.length <= 6) return value
  return `${value.slice(0, 3)}${"*".repeat(Math.max(4, value.length - 7))}${value.slice(-4)}`
}

export function maskName(value: string) {
  if (!value) return value
  if (value.length <= 1) return "*"
  return `${value[0]}${"*".repeat(Math.max(1, value.length - 1))}`
}

export function maskAddress(value: string) {
  if (!value) return value
  if (value.length <= 8) return `${value.slice(0, 2)}***`
  return `${value.slice(0, 6)}***${value.slice(-2)}`
}

export function sanitizeErrorMessage(message: string) {
  return message
    .replace(/auth[_-]?token["':=\s]+[A-Za-z0-9._~+/=-]+/gi, "auth_token=***")
    .replace(/"auth_token"\s*:\s*"[^"]+"/gi, '"auth_token":"***"')
    .replace(/"password"\s*:\s*"[^"]+"/gi, '"password":"***"')
    .replace(/"code"\s*:\s*"[^"]+"/gi, '"code":"***"')
}
