/**
 * SchemaScript Component
 * Renders JSON-LD schema markup as script tag
 */

interface SchemaScriptProps {
  schema: Record<string, any>
}

export function SchemaScript({ schema }: SchemaScriptProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema, null, 2),
      }}
    />
  )
}

interface MultipleSchemasProps {
  schemas: Record<string, any>[]
}

export function MultipleSchemas({ schemas }: MultipleSchemasProps) {
  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema, null, 2),
          }}
        />
      ))}
    </>
  )
}
