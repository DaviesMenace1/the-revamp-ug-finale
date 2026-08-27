export type ConsultationLifecycleRecord = {
  preferredDate: string | Date | null
  durationMinutes?: number | null
  status?: string | null
}

export function consultationEndTime(consultation: ConsultationLifecycleRecord) {
  if (!consultation.preferredDate) return null
  const start = new Date(consultation.preferredDate).getTime()
  if (!Number.isFinite(start)) return null
  const duration = Math.max(1, Number(consultation.durationMinutes) || 45)
  return new Date(start + duration * 60_000)
}

export function isConsultationHistory(consultation: ConsultationLifecycleRecord, now = Date.now()) {
  const status = String(consultation.status || '').toLowerCase()
  if (status === 'completed' || status === 'cancelled' || status === 'canceled') return true
  const endTime = consultationEndTime(consultation)
  return endTime ? endTime.getTime() <= now : false
}
