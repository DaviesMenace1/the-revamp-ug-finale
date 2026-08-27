import { createHash } from 'node:crypto'

export const PUBLIC_INFORMATION_SKILL = `---
name: public-website-information
description: Find current public information about The Revamp UG from published website records and official pages.
---

# Public website information

Use this skill for questions about The Revamp UG services, published products, current portfolio projects, journal articles, contact details, booking, and public policies.

## Source rules

Use the official website and its published records as the source of truth. Prefer the relevant public page or the read-only public APIs listed in the API Catalog. Do not infer stock, awards, certifications, delivery times, prices, or other claims that are not present in the current source.

## Safe boundaries

This skill is read-only. Do not request or expose administrator data, customer data, account sessions, checkout submissions, payment authorization details, promotion-redemption data, or private API responses. Direct customers to the official site for sign-in, checkout, consultation booking, and payment actions.

## Public entry points

- Website: https://therevampug.com/
- Markdown request: send Accept: text/markdown to a public page.
- API Catalog: https://therevampug.com/.well-known/api-catalog
- Public search endpoint: https://therevampug.com/mcp
- Contact: support@therevampug.com or +256 783 476 807
`

export function publicInformationSkillDigest() {
  return `sha256:${createHash('sha256').update(PUBLIC_INFORMATION_SKILL).digest('hex')}`
}
