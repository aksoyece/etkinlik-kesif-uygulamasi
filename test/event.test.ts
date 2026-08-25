import { describe, expect, it } from 'vitest'
import {
  formatEventDate,
  isFavoriteEvent,
  mapTicketmasterEvent,
  pickEventImage,
  toFavoriteEvent,
  toggleFavoriteEvent,
  toHttps,
  toTicketmasterDateTime
} from '../shared/utils/event'
import type { TicketmasterEvent } from '../app/types/event'

const sampleEvent: TicketmasterEvent = {
  id: 'evt-1',
  name: 'Jazz Night',
  url: 'http://ticketmaster.com/event/evt-1',
  images: [
    { url: 'http://cdn.example/small.jpg', ratio: '16_9', width: 100, fallback: true },
    { url: 'http://cdn.example/cover.jpg', ratio: '16_9', width: 1024, fallback: false }
  ],
  dates: {
    start: {
      localDate: '2026-09-12',
      localTime: '20:00:00'
    },
    status: { code: 'onsale' }
  },
  classifications: [
    { primary: true, segment: { name: 'Music' }, genre: { name: 'Jazz' } }
  ],
  _embedded: {
    venues: [
      {
        id: 'ven-1',
        name: 'Blue Note',
        city: { name: 'New York' },
        country: { name: 'United States' }
      }
    ]
  }
}

describe('etkinlik yardımcıları', () => {
  it('http adreslerini https yapar', () => {
    expect(toHttps('http://example.com/a.jpg')).toBe('https://example.com/a.jpg')
  })

  it('en uygun görseli seçer', () => {
    expect(pickEventImage(sampleEvent.images)).toBe('https://cdn.example/cover.jpg')
  })

  it('tarihi biçimler', () => {
    const label = formatEventDate(sampleEvent.dates)
    expect(label).toContain('2026')
  })

  it('Ticketmaster etkinliğini kart modeline çevirir', () => {
    const mapped = mapTicketmasterEvent(sampleEvent)
    expect(mapped.id).toBe('evt-1')
    expect(mapped.name).toBe('Jazz Night')
    expect(mapped.city).toBe('New York')
    expect(mapped.venue).toBe('Blue Note')
    expect(mapped.category).toBe('Music')
    expect(mapped.genre).toBe('Jazz')
  })

  it('favori ekler ve çıkarır', () => {
    const favorite = toFavoriteEvent(mapTicketmasterEvent(sampleEvent))
    const added = toggleFavoriteEvent([], favorite)
    expect(isFavoriteEvent(added, 'evt-1')).toBe(true)
    expect(toggleFavoriteEvent(added, favorite)).toEqual([])
  })

  it('Ticketmaster tarih formatı üretir', () => {
    expect(toTicketmasterDateTime('2026-09-12')).toBe('2026-09-12T00:00:00Z')
    expect(toTicketmasterDateTime('2026-09-12', true)).toBe('2026-09-12T23:59:59Z')
  })
})
