import type { EventSummary } from '../types/event'

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function toCalendarStamp(localDate?: string, localTime?: string): string | undefined {
  if (!localDate) {
    return undefined
  }

  const date = localDate.replaceAll('-', '')
  if (!localTime) {
    return date
  }

  const time = localTime.replaceAll(':', '').slice(0, 6)
  return `${date}T${time.padEnd(6, '0')}`
}

function addHoursToStamp(stamp: string, hours: number): string {
  if (!stamp.includes('T')) {
    const date = new Date(`${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}T00:00:00`)
    date.setDate(date.getDate() + 1)
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
  }

  const date = new Date(`${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}T${stamp.slice(9, 11)}:${stamp.slice(11, 13)}:${stamp.slice(13, 15) || '00'}`)
  date.setHours(date.getHours() + hours)
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}

function icsEscape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

export function buildGoogleCalendarUrl(event: EventSummary): string | undefined {
  const start = toCalendarStamp(event.localDate, event.localTime)
  if (!start) {
    return undefined
  }

  const end = addHoursToStamp(start, event.localTime ? 3 : 1)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name,
    dates: `${start}/${end}`,
    details: event.url || '',
    location: [event.venue, event.city].filter(Boolean).join(', ')
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function buildIcsContent(event: EventSummary): string | undefined {
  const start = toCalendarStamp(event.localDate, event.localTime)
  if (!start) {
    return undefined
  }

  const end = addHoursToStamp(start, event.localTime ? 3 : 1)
  const dateLine = start.includes('T')
    ? `DTSTART:${start}\r\nDTEND:${end}`
    : `DTSTART;VALUE=DATE:${start}\r\nDTEND;VALUE=DATE:${end}`

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Evently//Etkinlik Kesif//TR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.id}@etkinlik-kesif`,
    dateLine,
    `SUMMARY:${icsEscape(event.name)}`,
    event.venue ? `LOCATION:${icsEscape([event.venue, event.city].filter(Boolean).join(', '))}` : '',
    event.url ? `URL:${event.url}` : '',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n')
}

export function sortFavoritesByDate<T extends { localDate?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.localDate || '9999-12-31').localeCompare(b.localDate || '9999-12-31'))
}
