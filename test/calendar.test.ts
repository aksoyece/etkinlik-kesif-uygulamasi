import { describe, expect, it } from 'vitest'
import { buildIcsContent, sortFavoritesByDate, toCalendarStamp } from '../shared/utils/calendar'

describe('takvim yardımcıları', () => {
  it('ICS başlangıç damgası üretir', () => {
    expect(toCalendarStamp('2026-09-12', '20:00:00')).toBe('20260912T200000')
  })

  it('ICS içeriği üretir', () => {
    const ics = buildIcsContent({
      id: 'evt-1',
      name: 'Jazz Night',
      dateLabel: '12 Eylül',
      localDate: '2026-09-12',
      localTime: '20:00:00',
      venue: 'Blue Note',
      city: 'New York'
    })
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('DTSTART:20260912T200000')
    expect(ics).toContain('SUMMARY:Jazz Night')
  })

  it('favorileri tarihe göre sıralar', () => {
    const sorted = sortFavoritesByDate([
      { id: 'b', localDate: '2026-12-01' },
      { id: 'a', localDate: '2026-09-01' }
    ])
    expect(sorted.map(item => item.id)).toEqual(['a', 'b'])
  })
})
