/** ISO weeks start on Monday; their year is the year containing Thursday. */
export function weekLabel(date: string): string {
  const day = new Date(`${date}T12:00:00Z`)
  day.setUTCDate(day.getUTCDate() + 4 - (day.getUTCDay() || 7))
  const year = day.getUTCFullYear()
  const yearStart = Date.UTC(year, 0, 1, 12)
  const week = Math.ceil(((day.getTime() - yearStart) / 86400000 + 1) / 7)
  return `Week ${week} · ${year}`
}
