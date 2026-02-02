'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { SCHEDULE_HOURS, parseScheduleValue, buildScheduleValue } from '@/lib/schedule'

export interface SchedulePickerProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  id?: string
  label?: string
  hint?: string
}

/**
 * Sélecteur de créneau : date + heure pleine entre 10h et 22h uniquement.
 * Les posts ne peuvent être programmés qu'à ces créneaux (n8n tourne toutes les 2 h).
 */
export function SchedulePicker({
  value,
  onChange,
  disabled = false,
  id = 'scheduledAt',
  label = 'Programmer (optionnel)',
  hint = 'Créneaux : 10h, 12h, 14h, 16h, 18h, 20h, 22h. Le planning n8n tourne toutes les 2 h.',
}: SchedulePickerProps) {
  const parsed = parseScheduleValue(value || '')
  const dateStr = parsed?.date ?? ''
  const hour = parsed?.hour ?? SCHEDULE_HOURS[0]

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const date = e.target.value
    if (!date) {
      onChange('')
      return
    }
    onChange(buildScheduleValue(date, hour))
  }

  function handleHourChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const h = Number(e.target.value)
    if (!dateStr) {
      const today = new Date()
      const d = today.toISOString().slice(0, 10)
      onChange(buildScheduleValue(d, h))
      return
    }
    onChange(buildScheduleValue(dateStr, h))
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2 flex-wrap items-center">
        <Input
          id={id}
          type="date"
          value={dateStr}
          onChange={handleDateChange}
          disabled={disabled}
          min={new Date().toISOString().slice(0, 10)}
        />
        <select
          value={hour}
          onChange={handleHourChange}
          disabled={disabled}
          className="flex h-10 w-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {SCHEDULE_HOURS.map((h) => (
            <option key={h} value={h}>
              {String(h).padStart(2, '0')}h
            </option>
          ))}
        </select>
      </div>
      {hint && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}
