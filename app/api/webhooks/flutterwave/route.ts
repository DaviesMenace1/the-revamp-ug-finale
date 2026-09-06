export const dynamic = 'force-dynamic'

export async function POST() {
  return Response.json({ status: 'ignored', provider: 'flutterwave', message: 'Flutterwave is no longer an active payment provider. Use the Pesapal IPN endpoint.' })
}
