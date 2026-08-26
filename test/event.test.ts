import { describe, expect, it } from 'vitest'
import {
  EVENT_IMAGE_PLACEHOLDER,
  formatEventDate,
  getBestEventImage,
  isFavoriteEvent,
  mapTicketmasterEvent,
  toFavoriteEvent,
  toggleFavoriteEvent,
  toHttps,
  toHighResTicketmasterUrl,
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

  it('en uygun görseli seçer (16:9, min 640, fallback değil)', () => {
    expect(getBestEventImage(sampleEvent.images)).toBe('https://cdn.example/cover.jpg')
  })

  it('Ticketmaster kapak görselini (16:9, fallback olmayan) tercih eder', () => {
    const images = [
      { url: 'http://cdn.example/huge-square.jpg', ratio: '1_1', width: 2048, height: 2048, fallback: false },
      { url: 'http://cdn.example/RETINA_LANDSCAPE_16_9.jpg', ratio: '16_9', width: 1024, height: 576, fallback: false },
      { url: 'http://cdn.example/fallback.jpg', ratio: '16_9', width: 2048, height: 1152, fallback: true }
    ]
    expect(getBestEventImage(images)).toBe('https://cdn.example/RETINA_LANDSCAPE_16_9.jpg')
  })

  it('640px altı görselleri kartta kullanmaz', () => {
    const images = [
      { url: 'https://s1.ticketm.net/dam/a/abc/tiny_RECOMENDATION_16_9.jpg', ratio: '16_9', width: 305, height: 171, fallback: false }
    ]
    expect(getBestEventImage(images)).toBe(EVENT_IMAGE_PLACEHOLDER)
  })

  it('küçük 16:9 yerine yüksek çözünürlüklü görseli seçer', () => {
    const images = [
      { url: 'https://s1.ticketm.net/dam/a/abc/tiny_RECOMENDATION_16_9.jpg', ratio: '16_9', width: 305, height: 171, fallback: false },
      { url: 'https://s1.ticketm.net/dam/a/abc/wide_TABLET_LANDSCAPE_3_2.jpg', ratio: '3_2', width: 2048, height: 1365, fallback: false }
    ]
    expect(getBestEventImage(images)).toBe('https://s1.ticketm.net/dam/a/abc/wide_TABLET_LANDSCAPE_LARGE_16_9.jpg')
  })

  it('Ticketmaster CDN adresini büyük 16:9 varyanta yükseltir', () => {
    expect(toHighResTicketmasterUrl(
      'https://s1.ticketm.net/dam/a/abc/event_RECOMENDATION_16_9.jpg'
    )).toBe('https://s1.ticketm.net/dam/a/abc/event_TABLET_LANDSCAPE_LARGE_16_9.jpg')
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
    expect(mapped.status).toBe('onsale')
    expect(mapped.image).toBe('https://cdn.example/cover.jpg')
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
