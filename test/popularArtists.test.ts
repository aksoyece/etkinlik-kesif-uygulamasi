import { describe, expect, it } from 'vitest'
import type { EventSummary } from '../app/types/event'
import { EVENT_IMAGE_PLACEHOLDER } from '../shared/utils/event'
import { pickPopularArtists } from '../shared/utils/popularArtists'

function event(partial: Partial<EventSummary> & Pick<EventSummary, 'id' | 'name'>): EventSummary {
  return {
    dateLabel: '1 Ocak 2026',
    ...partial
  }
}

describe('pickPopularArtists', () => {
  it('isim bazlı tekilleştirir ve etkinlik sayısına göre sıralar', () => {
    const artists = pickPopularArtists([
      event({
        id: 'e1',
        name: 'Show A',
        localDate: '2026-10-01',
        category: 'Music',
        genre: 'Rock',
        status: 'onsale',
        attractions: [{ id: 'a1', name: 'JAY-Z', genre: 'Hip-Hop', image: 'https://cdn.example/jay.jpg' }]
      }),
      event({
        id: 'e2',
        name: 'Show B',
        localDate: '2026-09-01',
        category: 'Music',
        status: 'onsale',
        attractions: [{ id: 'a1', name: 'jay-z', genre: 'Hip-Hop' }]
      }),
      event({
        id: 'e3',
        name: 'Match',
        localDate: '2026-08-20',
        category: 'Sports',
        status: 'onsale',
        attractions: [{ id: 'a2', name: 'NFL', genre: 'Football' }]
      })
    ], 5)

    expect(artists[0]?.name).toBe('JAY-Z')
    expect(artists[0]?.eventCount).toBe(2)
    expect(artists[0]?.image).toBe('https://cdn.example/jay.jpg')
    expect(artists[1]?.name).toBe('NFL')
  })

  it('iptal / offsale etkinlikleri ve boş listeyi yok sayar', () => {
    expect(pickPopularArtists([
      event({
        id: 'e1',
        name: 'Cancelled',
        status: 'cancelled',
        attractions: [{ name: 'Ghost' }]
      }),
      event({
        id: 'e2',
        name: 'No artists',
        status: 'onsale'
      })
    ])).toEqual([])
  })

  it('attraction görseli yoksa etkinlik görselini kullanır', () => {
    const [artist] = pickPopularArtists([
      event({
        id: 'e1',
        name: 'Show',
        localDate: '2026-11-01',
        status: 'onsale',
        image: 'https://cdn.example/event.jpg',
        attractions: [{ name: 'Band', image: EVENT_IMAGE_PLACEHOLDER }]
      })
    ])

    expect(artist?.image).toBe('https://cdn.example/event.jpg')
  })
})
