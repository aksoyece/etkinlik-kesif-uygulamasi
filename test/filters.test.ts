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
import { ACTIVE_MARKET, getActiveCountryCode } from '../shared/utils/market'

describe('filtre yardımcıları', () => {
  it('aktif market UK (GB)', () => {
    expect(getActiveCountryCode()).toBe('GB')
    expect(ACTIVE_MARKET.id).toBe('GB')
  })

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
      city: 'London'
    }, 2))

    expect(query.keyword).toBe('rock')
    expect(query.city).toBe('London')
    expect(query.countryCode).toBe('GB')
    expect(query.page).toBe('1')
    expect(query.size).toBe(String(PAGE_SIZE))
    expect(query.startDateTime).toBeTruthy()
    // Tarih yoksa şu an (gün başı değil) — geçmiş saatler elensin
    expect(query.startDateTime).not.toMatch(/T00:00:00Z$/)
  })

  it('bugünün startDate seçiminde startDateTime anlık olur', () => {
    const today = new Date().toISOString().slice(0, 10)
    const query = toTicketmasterQuery(toSearchParams({
      ...defaultFilterState(),
      startDate: today
    }, 1))

    expect(query.startDateTime).not.toBe(`${today}T00:00:00Z`)
    expect(query.startDateTime.startsWith(today)).toBe(true)
  })

  it('gelecek gün startDate’te gün başını kullanır', () => {
    const query = toTicketmasterQuery(toSearchParams({
      ...defaultFilterState(),
      startDate: '2099-06-15'
    }, 1))

    expect(query.startDateTime).toBe('2099-06-15T00:00:00Z')
  })

  it('toplam sonucu API limitine göre keser', () => {
    expect(capTotalResults(5000, 12)).toBeLessThanOrEqual(1000)
  })
})
