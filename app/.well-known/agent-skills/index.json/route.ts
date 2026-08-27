import { publicInformationSkillDigest } from '@/lib/agent-skills'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')

export const dynamic = 'force-static'

export function GET() {
  return Response.json({
    $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    skills: [
      {
        name: 'public-website-information',
        description: 'Find current public information about The Revamp UG from published website records and official pages.',
        type: 'text/markdown',
        url: `${SITE_URL}/.well-known/agent-skills/public-website-information`,
        digest: publicInformationSkillDigest(),
      },
    ],
  }, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
