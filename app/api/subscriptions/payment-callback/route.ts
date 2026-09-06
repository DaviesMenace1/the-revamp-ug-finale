export const dynamic = 'force-dynamic'

export async function GET() {
  return Response.json({ status: 'ignored', provider: 'flutterwave', message: 'Paid subscriptions are disabled. Membership access is based on points or approved trade applications.' }, { status: 410 })
}
