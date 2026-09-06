export const dynamic = 'force-dynamic'

export async function POST() {
  return Response.json({ error: 'Direct payment authorization is no longer used. Continue through the Pesapal payment page.' }, { status: 410 })
}
