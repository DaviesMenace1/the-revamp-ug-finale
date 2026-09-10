import { NextRequest, NextResponse } from 'next/server'
import { sendDueConsultationReminders } from '@/lib/notifications/consultation-reminders'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim()
  const authorization = request.headers.get('authorization')
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const summary = await sendDueConsultationReminders()
    return NextResponse.json({ success: true, ...summary })
  } catch (error) {
    console.error('[consultation-reminders] cron failed:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Reminder job failed.' },
      { status: 500 },
    )
  }
}
