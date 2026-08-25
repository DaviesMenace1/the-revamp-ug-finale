import { NextResponse } from 'next/server'
import { createSlots } from '@/lib/actions/consultation-booking'
import { requireAdminApi } from '@/lib/auth/api'

export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 4096

function errorResponse(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  const authorizationError = await requireAdminApi()
  if (authorizationError) return authorizationError

  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > MAX_BODY_BYTES) return errorResponse('The slot request is too large.', 413)

  let body: { startTimes?: unknown; durationMinutes?: unknown; mode?: unknown; location?: unknown }
  try {
    body = await request.json() as { startTimes?: unknown; durationMinutes?: unknown; mode?: unknown; location?: unknown }
  } catch {
    return errorResponse('A JSON slot request is required.', 400)
  }

  if (!Array.isArray(body.startTimes) || body.startTimes.length < 1 || body.startTimes.length > 20 || !body.startTimes.every((value) => typeof value === 'string')) {
    return errorResponse('At least one valid start time is required.', 400)
  }
  if (typeof body.durationMinutes !== 'number' && typeof body.durationMinutes !== 'string') {
    return errorResponse('A valid duration is required.', 400)
  }
  if (typeof body.mode !== 'string') return errorResponse('A valid meeting format is required.', 400)

  try {
    const result = await createSlots({
      startTimes: body.startTimes,
      durationMinutes: Number(body.durationMinutes),
      mode: body.mode,
      location: typeof body.location === 'string' ? body.location : undefined,
    })
    return NextResponse.json(result, { status: result.success ? 200 : 400, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[admin/consultations/slots] slot creation failed:', error)
    return errorResponse('The availability request could not be completed. Please try again.', 500)
  }
}
