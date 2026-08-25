import { describe, expect, it } from 'vitest'
import {
  capTotalResults,
  defaultFilterState,
  eventFilterSchema,
  filtersFromQuery,
  filtersToQuery,
  PAGE_SIZE,
  toSearchParams,
  toTicketmasterQuery
} from '../shared/utils/filters'

describe('filtre yardımcıları', () => {
  it('query parametrelerini filtre state’ine çevirir', () => {
    const state = filtersFromQuery({
      keyword: 'jazz',
      city: 'London',
      category: 'Music',
      page: '2'
    })

    expect(state.keyword).toBe('jazz')
    expect(state.city).toBe('London')
    expect(state.classificationName).toBe('Music')
    expect(state.sort).toBe('date,asc')
  })

  it('boş değerleri query’den çıkarır', () => {
    expect(filtersToQuery(defaultFilterState(), 1)).toEqual({})
  })

  it('kısa arama metnini reddeder', () => {
    const result = eventFilterSchema.safeParse({
      ...defaultFilterState(),
      keyword: 'a'
    })
    expect(result.success).toBe(false)
  })

  it('bitiş tarihi başlangıçtan önceyse hata verir', () => {
    const result = eventFilterSchema.safeParse({
      ...defaultFilterState(),
      startDate: '2026-10-10',
      endDate: '2026-10-01'
    })
    expect(result.success).toBe(false)
  })

  it('Ticketmaster query üretir', () => {
    const query = toTicketmasterQuery(toSearchParams({
      ...defaultFilterState(),
      keyword: 'rock',
      city: 'Berlin'
    }, 2))

    expect(query.keyword).toBe('rock')
    expect(query.city).toBe('Berlin')
    expect(query.page).toBe('1')
    expect(query.size).toBe(String(PAGE_SIZE))
    expect(query.startDateTime).toBeTruthy()
  })

  it('toplam sonucu API limitine göre keser', () => {
    expect(capTotalResults(5000, 12)).toBeLessThanOrEqual(1000)
  })
})
