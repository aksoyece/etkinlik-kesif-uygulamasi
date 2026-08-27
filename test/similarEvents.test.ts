import { describe, expect, it } from 'vitest'
import type { EventSummary } from '../app/types/event'
import {
  normalizeEventTitle,
  pickSimilarEvents,
  toSimilarEventsQuery
} from '../shared/utils/similarEvents'

function event(partial: Partial<EventSummary> & Pick<EventSummary, 'id' | 'name'>): EventSummary {
  return {
    dateLabel: '1 Ocak 2026',
    status: 'onsale',
    ...partial
  }
}

describe('similarEvents', () => {
  it('mevcut etkinliği çıkarır ve aynı şehri öne alır', () => {
    const pool = [
      event({ id: 'cur', name: 'Current', city: 'London', category: 'Music' }),
      event({ id: '1', name: 'Manchester Show', city: 'Manchester', category: 'Music' }),
      event({ id: '2', name: 'London A', city: 'London', category: 'Music' }),
      event({ id: '3', name: 'London B', city: 'London', category: 'Music' }),
      event({ id: 'x', name: 'Cancelled', city: 'London', category: 'Music', status: 'cancelled' })
    ]

    const picked = pickSimilarEvents(pool, { excludeId: 'cur', preferCity: 'London', limit: 3 })
    expect(picked.map(e => e.id)).toEqual(['2', '3', '1'])
  })

  it('aynı gösterinin farklı seanslarını tekilleştirir ve en yakın tarihi tutar', () => {
    const pool = [
      event({
        id: 'hp-late',
        name: 'Harry Potter and the Cursed Child',
        city: 'London',
        localDate: '2026-09-04',
        localTime: '19:30:00'
      }),
      event({
        id: 'hp-soon',
        name: 'Harry Potter and the Cursed Child',
        city: 'London',
        localDate: '2026-08-29',
        localTime: '14:00:00'
      }),
      event({
        id: 'hp-mid',
        name: 'Harry Potter and the Cursed Child',
        city: 'London',
        localDate: '2026-08-30',
        localTime: '19:30:00'
      }),
      event({
        id: 'lion',
        name: 'The Lion King',
        city: 'London',
        localDate: '2026-09-01'
      }),
      event({
        id: 'wicked',
        name: 'Wicked',
        city: 'Manchester',
        localDate: '2026-08-28'
      })
    ]

    const picked = pickSimilarEvents(pool, {
      excludeId: 'cur',
      preferCity: 'London',
      limit: 4
    })

    expect(picked.map(e => e.id)).toEqual(['hp-soon', 'lion', 'wicked'])
    expect(picked).toHaveLength(3)
  })

  it('görüntülenen gösterinin diğer seanslarını da eler', () => {
    const pool = [
      event({
        id: 'hp-2',
        name: 'Harry Potter – 30 Ağustos',
        localDate: '2026-08-30'
      }),
      event({
        id: 'other',
        name: 'Matilda The Musical',
        localDate: '2026-09-01'
      })
    ]

    const picked = pickSimilarEvents(pool, {
      excludeId: 'hp-1',
      excludeName: 'Harry Potter – 29 Ağustos',
      limit: 4
    })

    expect(picked.map(e => e.id)).toEqual(['other'])
  })

  it('normalizeEventTitle tarih eklerini yok sayar', () => {
    expect(normalizeEventTitle('Harry Potter – 29 Ağustos'))
      .toBe(normalizeEventTitle('Harry Potter – 30 August'))
    expect(normalizeEventTitle('Wicked')).toBe('wicked')
  })

  it('vague segment’te Family genre için Family sorgusu üretir', () => {
    expect(toSimilarEventsQuery({ category: 'Miscellaneous', genre: 'Family' }))
      .toEqual({ classificationName: 'Family' })
    expect(toSimilarEventsQuery({ category: 'Music', genre: 'Jazz' }))
      .toEqual({ classificationName: 'Music' })
    expect(toSimilarEventsQuery({ category: 'Miscellaneous', genre: 'Undefined' }))
      .toBeNull()
  })
})
