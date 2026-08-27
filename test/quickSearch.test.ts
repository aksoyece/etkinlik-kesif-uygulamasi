import { describe, expect, it } from 'vitest'
import type { EventSummary } from '../app/types/event'
import { buildQuickSearchResults } from '../shared/utils/quickSearch'

function event(partial: Partial<EventSummary> & Pick<EventSummary, 'id' | 'name'>): EventSummary {
  return {
    dateLabel: '1 Ocak 2026',
    ...partial
  }
}

describe('buildQuickSearchResults', () => {
  const pool = [
    event({
      id: 'e1',
      name: 'Hans Zimmer Live',
      city: 'London',
      venue: 'O2 Arena',
      venueId: 'v1',
      image: 'https://cdn.example/zimmer-event.jpg',
      attractions: [{ id: 'a1', name: 'Hans Zimmer', image: 'https://cdn.example/zimmer.jpg' }]
    }),
    event({
      id: 'e2',
      name: 'Harry Potter and the Cursed Child',
      city: 'London',
      venue: 'Palace Theatre',
      venueId: 'v2',
      attractions: [{ id: 'a2', name: 'Harry Potter Theatre Company' }]
    }),
    event({
      id: 'e3',
      name: 'Chelsea vs Arsenal',
      city: 'London',
      venue: 'Stamford Bridge',
      attractions: [{ id: 'a3', name: 'Chelsea' }, { id: 'a4', name: 'Arsenal' }]
    })
  ]

  it('2 karakterden kısa sorguda boş döner', () => {
    expect(buildQuickSearchResults(pool, 'h')).toEqual([])
  })

  it('sanatçı, etkinlik ve mekan sonuçlarını karıştırır', () => {
    const results = buildQuickSearchResults(pool, 'han')
    const types = results.map(r => r.type)
    expect(types).toContain('artist')
    expect(types).toContain('event')
    expect(results.some(r => r.name === 'Hans Zimmer')).toBe(true)
    expect(results.some(r => r.name === 'Hans Zimmer Live')).toBe(true)
  })

  it('tip başına limiti aşmaz ve toplamı sınırlar', () => {
    const results = buildQuickSearchResults(pool, 'a', { maxTotal: 4, maxPerType: 1, minQueryLength: 1 })
    expect(results.length).toBeLessThanOrEqual(4)
    const counts = results.reduce<Record<string, number>>((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1
      return acc
    }, {})
    expect(Object.values(counts).every(n => n <= 1)).toBe(true)
  })

  it('etkinlik detay ve sanatçı keyword linkleri üretir', () => {
    const results = buildQuickSearchResults(pool, 'chelsea')
    const eventHit = results.find(r => r.type === 'event')
    const artistHit = results.find(r => r.type === 'artist' && r.name === 'Chelsea')
    expect(eventHit?.href).toBe('/events/e3')
    expect(artistHit?.href).toContain('/events?keyword=Chelsea')
  })
})
