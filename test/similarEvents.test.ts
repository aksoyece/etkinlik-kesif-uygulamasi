import { describe, expect, it } from 'vitest'
import type { EventSummary } from '../app/types/event'
import { pickSimilarEvents, toSimilarEventsQuery } from '../shared/utils/similarEvents'

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

  it('vague segment’te Family genre için Family sorgusu üretir', () => {
    expect(toSimilarEventsQuery({ category: 'Miscellaneous', genre: 'Family' }))
      .toEqual({ classificationName: 'Family' })
    expect(toSimilarEventsQuery({ category: 'Music', genre: 'Jazz' }))
      .toEqual({ classificationName: 'Music' })
    expect(toSimilarEventsQuery({ category: 'Miscellaneous', genre: 'Undefined' }))
      .toBeNull()
  })
})
