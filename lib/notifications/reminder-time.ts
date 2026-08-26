export function formatRemainingTime(startTime: Date, now: Date) {
  const remainingMinutes = Math.max(0, Math.ceil((startTime.getTime() - now.getTime()) / (60 * 1000)))
  if (remainingMinutes <= 0) return 'now'
  if (remainingMinutes < 60) return `${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}`

  const hours = Math.floor(remainingMinutes / 60)
  const minutes = remainingMinutes % 60
  const hourText = `${hours} hour${hours === 1 ? '' : 's'}`
  if (!minutes) return hourText
  return `${hourText} and ${minutes} minute${minutes === 1 ? '' : 's'}`
}
