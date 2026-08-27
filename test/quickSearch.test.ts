import { describe, expect, it } from 'vitest'
import type { EventSummary } from '../app/types/event'
import {
  mapEventsToQuickSearchResults,
  toQuickSearchApiQuery,
  toQuickSearchEventsPath,
  QUICK_SEARCH_SORT,
  QUICK_SEARCH_LIMIT
} from '../shared/utils/quickSearch'

function event(partial: Partial<EventSummary> & Pick<EventSummary, 'id' | 'name'>): EventSummary {
  return {
    dateLabel: '1 Ocak 2026',
    ...partial
  }
}

describe('quickSearch API eşlemesi', () => {
  it('API etkinliklerini dropdown satırına çevirir ve limiti uygular', () => {
    const pool = Array.from({ length: 8 }, (_, i) => event({
      id: `e${i}`,
      name: `Event ${i}`,
      city: 'London',
      venue: 'O2',
      image: 'https://cdn.example/a.jpg'
    }))

    const results = mapEventsToQuickSearchResults(pool, 5)
    expect(results).toHaveLength(5)
    expect(results[0]?.href).toBe('/events/e0')
    expect(results[0]?.subtitle).toContain('London')
    expect(results[0]?.icon).toBe('i-lucide-calendar')
  })

  it('/events sayfası ile aynı keyword query’sini üretir', () => {
    expect(toQuickSearchApiQuery('  hans  ', 5)).toEqual({
      keyword: 'hans',
      sort: QUICK_SEARCH_SORT,
      size: 5,
      page: 1
    })
    expect(QUICK_SEARCH_SORT).toBe('date,asc')
    expect(QUICK_SEARCH_LIMIT).toBe(5)
    expect(toQuickSearchEventsPath('hans zimmer')).toBe('/events?keyword=hans%20zimmer')
  })
})
