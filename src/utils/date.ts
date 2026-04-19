import { format, startOfWeek, endOfWeek, subWeeks, addWeeks, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function formatDateSpanish(isoDate: string): string {
  return format(parseISO(isoDate), "EEEE, d 'de' MMMM", { locale: es })
}

export function formatDateShort(isoDate: string): string {
  return format(parseISO(isoDate), 'd MMM', { locale: es })
}

export function formatDateTime(iso: string): string {
  return format(parseISO(iso), 'HH:mm', { locale: es })
}

export function getWeekBounds(offset = 0): { start: string; end: string; label: string } {
  const base = offset === 0 ? new Date() : offset > 0 ? addWeeks(new Date(), offset) : subWeeks(new Date(), -offset)
  const start = startOfWeek(base, { weekStartsOn: 1 })
  const end = endOfWeek(base, { weekStartsOn: 1 })
  const label = offset === 0 ? 'Esta semana' : offset === -1 ? 'Semana pasada' : format(start, "'Semana del' d MMM", { locale: es })
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
    label,
  }
}

export function getDayAbbr(isoDate: string): string {
  return format(parseISO(isoDate), 'EEE', { locale: es })
}

export function formatDuration(startIso: string, endIso?: string): string {
  const start = parseISO(startIso)
  const end = endIso ? parseISO(endIso) : new Date()
  const minutes = Math.floor((end.getTime() - start.getTime()) / 60000)
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}
