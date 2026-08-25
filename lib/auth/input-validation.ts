const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001F\u007F]/

export const AUTH_EMAIL_MAX_LENGTH = 254
export const AUTH_PASSWORD_MAX_LENGTH = 128
export const AUTH_NAME_MAX_LENGTH = 100
export const AUTH_USERNAME_MAX_LENGTH = 64
export const AUTH_CODE_MAX_LENGTH = 32

export function normalizeAuthEmail(value: string) {
  return value.trim().toLowerCase()
}

export function isValidAuthEmail(value: string) {
  return value.length > 0 && value.length <= AUTH_EMAIL_MAX_LENGTH && EMAIL_PATTERN.test(value)
}

export function hasUnsafeControlCharacters(value: string) {
  return CONTROL_CHARACTER_PATTERN.test(value)
}

export function isBoundedAuthText(value: string, maxLength: number, required = false) {
  const normalized = value.trim()
  return (!required || normalized.length > 0) && normalized.length <= maxLength && !hasUnsafeControlCharacters(normalized)
}

export function isValidAuthPassword(value: string) {
  return value.length >= 8 && value.length <= AUTH_PASSWORD_MAX_LENGTH && !hasUnsafeControlCharacters(value)
}

export function isValidVerificationCode(value: string) {
  const normalized = value.trim()
  return normalized.length > 0 && normalized.length <= AUTH_CODE_MAX_LENGTH && /^[0-9A-Za-z-]+$/.test(normalized)
}
