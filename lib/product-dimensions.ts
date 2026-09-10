export type ProductDimension = {
  key: string
  label: string
  value: string | number
  unit?: string
}

type RecordValue = Record<string, unknown>

type DimensionField = {
  key: string
  label?: string
  type?: string
  unit?: string
}

function asRecord(value: unknown): RecordValue | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : null
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function hasValue(value: unknown): value is string | number {
  if (typeof value === 'number') return Number.isFinite(value)
  return typeof value === 'string' && value.trim().length > 0
}

function humanizeKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (value) => value.toUpperCase())
}

function templateFields(product: RecordValue): DimensionField[] {
  const subCategory = asRecord(product.subCategory)
  const template = asRecord(subCategory?.template) ?? asRecord(product.attributeTemplate)
  const schema = asRecord(template?.schemaDefinition) ?? asRecord(product.templateSchema)
  if (!schema) return []

  const groups = Array.isArray(schema.groups) ? schema.groups : []
  const groupedFields = groups.flatMap((group) => {
    const groupRecord = asRecord(group)
    return Array.isArray(groupRecord?.fields) ? groupRecord.fields : []
  })
  const fields = Array.isArray(schema.fields) ? schema.fields : []
  return [...groupedFields, ...fields]
    .map(asRecord)
    .filter((field): field is RecordValue => Boolean(field))
    .map((field) => ({
      key: asString(field.key) ?? '',
      label: asString(field.label),
      type: asString(field.type),
      unit: asString(field.unit),
    }))
    .filter((field) => field.key)
}

function valueFromSources(key: string, attributes: RecordValue | null, legacyDimensions: RecordValue | null, product: RecordValue) {
  const nestedAttributeDimensions = asRecord(attributes?.dimensions)
  return attributes?.[key] ?? nestedAttributeDimensions?.[key] ?? legacyDimensions?.[key] ?? product[key]
}

export function getProductDimensions(product: unknown): ProductDimension[] {
  const record = asRecord(product)
  if (!record) return []

  const attributes = asRecord(record.attributes)
  const nestedAttributeDimensions = asRecord(attributes?.dimensions)
  const legacyDimensions = asRecord(record.dimensions)
  const defaultUnit = asString(legacyDimensions?.unit) ?? asString(nestedAttributeDimensions?.unit)
  const fields = templateFields(record)
  const fieldByKey = new Map(fields.map((field) => [field.key, field]))
  const isDimensionKey = (key: string) => /(?:width|height|depth|length|diameter|thickness|radius|circumference|dimension|size)/i.test(key)
  const measurementFields = fields.filter((field) => field.type === 'measurement')
  const storedKeys = new Set([
    ...Object.keys(legacyDimensions ?? {}).filter((key) => key !== 'unit'),
    ...Object.keys(nestedAttributeDimensions ?? {}).filter((key) => key !== 'unit'),
    ...Object.keys(attributes ?? {}).filter((key) => fieldByKey.get(key)?.type === 'measurement' || isDimensionKey(key)),
  ])
  const orderedKeys = [
    ...measurementFields.map((field) => field.key),
    ...Array.from(storedKeys),
  ].filter((key, index, keys) => keys.indexOf(key) === index)

  return orderedKeys.flatMap((key) => {
    const field = fieldByKey.get(key)
    const value = valueFromSources(key, attributes, legacyDimensions, record)
    if (!hasValue(value)) return []

    const valueRecord = asRecord(value)
    const normalizedValue = valueRecord?.value
    const displayValue = hasValue(normalizedValue) ? normalizedValue : value
    if (!hasValue(displayValue)) return []

    const unit = field?.unit ?? asString(valueRecord?.unit) ?? defaultUnit ?? (field?.type === 'measurement' ? 'cm' : undefined)
    return [{
      key,
      label: field?.label || humanizeKey(key),
      value: displayValue,
      ...(unit ? { unit } : {}),
    }]
  })
}
