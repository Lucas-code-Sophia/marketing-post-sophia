/**
 * Créneaux de publication : toutes les 2 heures, de 10h à 22h.
 * Permet de faire tourner le workflow n8n toutes les 2 heures.
 */

export const SCHEDULE_HOUR_START = 10
export const SCHEDULE_HOUR_END = 22

/** Heures autorisées : 10h, 12h, 14h, 16h, 18h, 20h, 22h (toutes les 2 h) */
export const SCHEDULE_HOURS = [10, 12, 14, 16, 18, 20, 22]

/**
 * Arrondit une heure au créneau autorisé le plus proche (10, 12, 14, 16, 18, 20, 22).
 */
export function snapHourToSlot(hour: number): number {
  if (hour <= SCHEDULE_HOUR_START) return SCHEDULE_HOUR_START
  if (hour >= SCHEDULE_HOUR_END) return SCHEDULE_HOUR_END
  const idx = SCHEDULE_HOURS.findIndex((h) => h >= hour)
  if (idx <= 0) return SCHEDULE_HOURS[0]
  const prev = SCHEDULE_HOURS[idx - 1]
  const next = SCHEDULE_HOURS[idx]
  return hour - prev <= next - hour ? prev : next
}

/**
 * Convertit une valeur ISO ou "YYYY-MM-DDTHH:mm" en date + heure locale (créneau 10/12/14/16/18/20/22).
 * Pour affichage dans le SchedulePicker.
 */
export function parseScheduleValue(value: string | null): { date: string; hour: number } | null {
  if (!value || !value.trim()) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const date = `${year}-${month}-${day}`
  const rawHour = d.getHours()
  const hour = snapHourToSlot(Math.min(SCHEDULE_HOUR_END, Math.max(SCHEDULE_HOUR_START, rawHour)))
  return { date, hour }
}

/**
 * Construit la valeur "YYYY-MM-DDTHH:00" (heure locale) à partir d'une date et d'une heure.
 * L'heure doit être un créneau autorisé (10, 12, 14, 16, 18, 20, 22).
 */
export function buildScheduleValue(date: string, hour: number): string {
  const h = SCHEDULE_HOURS.includes(hour) ? hour : snapHourToSlot(hour)
  return `${date}T${String(h).padStart(2, '0')}:00`
}
