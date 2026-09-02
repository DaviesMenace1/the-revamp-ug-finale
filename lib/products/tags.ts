export function normalizeProductTags(value: unknown): string[] {
  const values = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : []

  const seen = new Set<string>()
  return values
    .flatMap((item) => String(item).split(','))
    .map((item) => item.trim().replace(/\s+/g, ' '))
    .filter((item) => item.length > 0)
    .filter((item) => {
      const key = item.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 30)
}

export function productTagsToKeywords(value: unknown): string[] {
  return normalizeProductTags(value)
}

export function productTagsToSearchText(value: unknown): string {
  return normalizeProductTags(value).join(' ')
}
