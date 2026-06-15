/**
 * Server component for emitting JSON-LD structured data.
 *
 * Pass a single object or array of objects. The content is serialized to a
 * <script type="application/ld+json"> tag and escaped to prevent
 * `</script>` injection attacks via user-controlled fields (business names,
 * descriptions, etc).
 *
 * Usage:
 *   <SchemaScript data={buildOrganizationSchema(...)} />
 *   <SchemaScript data={[orgSchema, websiteSchema]} />
 */

interface Props {
  data: unknown | unknown[]
}

function serialize(payload: unknown | unknown[]): string {
  const out = Array.isArray(payload) ? payload : [payload]
  // Replace closing tag sequences to neutralize XSS via injected fields.
  return JSON.stringify(out.length === 1 ? out[0] : out).replace(/<\/(script)/gi, '<\\/$1')
}

export function SchemaScript({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: serialize(data) }}
    />
  )
}
