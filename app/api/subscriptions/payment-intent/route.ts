export const dynamic = 'force-dynamic'

export async function POST() {
  return Response.json(
    {
      error: 'Paid membership and trade subscriptions are no longer available. Access is based on points or approved trade applications.',
    },
    { status: 410 },
  )
}
