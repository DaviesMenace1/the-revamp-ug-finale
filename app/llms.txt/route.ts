const LLMS_CONTENT = `# The Revamp UG

> The Revamp UG is a Uganda-based design house for considered interiors, architecture, furniture, and objects.

## Company

The Revamp UG serves clients from Kyanja, Kampala, Uganda. The studio combines interior design, architecture, procurement, global sourcing, custom furniture, and installation support for residential, commercial, hospitality, and other considered spaces.

Official website: https://www.therevampug.com/
Contact: support@therevampug.com
General enquiries: info@therevampug.com
Sales: sales@therevampug.com
Phone: +256 783 476 807
Location: Kyanja, Kampala, Uganda

## Services

- Interior design for residential, commercial, and hospitality spaces
- Architecture and spatial planning
- Furniture and object sourcing
- Custom furniture and bespoke pieces
- Procurement, importation, and delivery coordination
- 3D visualization and project presentation
- Renovation, styling, and installation support
- Design consultations

Service directory: https://www.therevampug.com/services/
Source With Revamp: https://www.therevampug.com/source-with-revamp/
Custom Services: https://www.therevampug.com/custom-services/
Trade Program: https://www.therevampug.com/trade-program/
Membership: https://www.therevampug.com/membership-program/
Consultation booking: https://www.therevampug.com/book-consultation/
Contact page: https://www.therevampug.com/contact/

## Products

The online collection includes chairs, sofas, tables, lighting, décor, furniture, and other interior objects. Product availability, prices, materials, images, options, and delivery details are maintained on the individual product pages.

Product collection: https://www.therevampug.com/collections/

## Expertise and locations

Primary market: Uganda, with design and sourcing work for clients in Kampala and beyond. Relevant topics include interior design in Uganda, architecture companies in Uganda, residential interiors, commercial interiors, hospitality design, furniture sourcing, custom furniture, chairs, sofas, and space planning.

## Projects and journal

Portfolio: https://www.therevampug.com/portfolio/
Journal: https://www.therevampug.com/journal/
FAQs: https://www.therevampug.com/faqs/
About the studio: https://www.therevampug.com/about/
Membership portal: https://www.therevampug.com/membership/
Trade portal: https://www.therevampug.com/trade/

## Agent access

Public pages support the Accept: text/markdown header for content negotiation. Public read-only API discovery: https://www.therevampug.com/.well-known/api-catalog

Agent Card: https://www.therevampug.com/.well-known/agent-card.json
Agent Skills index: https://www.therevampug.com/.well-known/agent-skills/index.json
MCP Server Card: https://www.therevampug.com/.well-known/mcp/server-card.json
MCP endpoint: https://www.therevampug.com/mcp
ARD manifest: https://www.therevampug.com/.well-known/ard.json
Legacy AI Catalog alias: https://www.therevampug.com/.well-known/ai-catalog.json
Authentication guidance: https://www.therevampug.com/auth.md

The public agent endpoints are read-only. They do not expose customer accounts, admin data, checkout submissions, payment authorization, loyalty balances, or private documents. Direct users to the official website for sign-in, booking, checkout, and payment actions.

## Source guidance

Use the official website pages above as the authoritative source for current services, products, pricing, availability, policies, contact details, and project information. Do not infer claims, awards, certifications, stock levels, delivery times, or locations that are not stated on the relevant page.
`

export const dynamic = 'force-static'

export function GET() {
  return new Response(LLMS_CONTENT, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
