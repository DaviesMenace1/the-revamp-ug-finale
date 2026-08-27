type RecordValue = Record<string, unknown>

function asRecord(value: unknown): RecordValue | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : null
}

function clean(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 180) : null
}

function optionLabel(value: unknown) {
  const record = asRecord(value)
  if (!record) return clean(value)
  return clean(record.label) || clean(record.name) || clean(record.value)
}

function dimensionsLabel(value: unknown) {
  const dimensions = asRecord(value)
  if (!dimensions) return null
  const width = clean(dimensions.width)
  const height = clean(dimensions.height)
  const depth = clean(dimensions.depth)
  const unit = clean(dimensions.unit) || 'in'
  const values = [width && `W ${width}`, height && `H ${height}`, depth && `D ${depth}`].filter(Boolean)
  return values.length ? `${values.join(' · ')} ${unit}` : null
}

export function getOrderItemOptionLines(item: unknown) {
  const record = asRecord(item)
  if (!record) return []
  const configuration = asRecord(record.configuration) || asRecord(record.selectedOptions) || {}
  const lines: string[] = []
  const add = (label: string, value: unknown) => {
    const text = optionLabel(value)
    if (text && !lines.includes(`${label}: ${text}`)) lines.push(`${label}: ${text}`)
  }

  add('Colour', configuration.color ?? record.color)
  add('Fabric', configuration.fabric ?? record.fabric)
  add('Material', configuration.material ?? record.material)
  add('Option', configuration.variant ?? record.variant)

  const accessories = configuration.accessories ?? record.accessories
  if (Array.isArray(accessories)) {
    const labels = accessories.map(optionLabel).filter((value): value is string => Boolean(value))
    if (labels.length) lines.push(`Add-ons: ${labels.join(', ')}`)
  } else {
    add('Add-ons', accessories)
  }

  const dimensions = dimensionsLabel(configuration.dimensions ?? record.dimensions ?? record.customDimensions)
  if (dimensions) lines.push(`Custom sizing: ${dimensions}`)

  return lines
}
