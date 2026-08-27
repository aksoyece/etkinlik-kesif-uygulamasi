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
        attractions: [{ name: 'Band', image: 'https://cdn.example/band.jpg' }]
      })
    ])

    expect(artist?.image).toBe('https://cdn.example/band.jpg')
  })

  it('çoklu attraction’da event afişini rakip logosu olarak kullanmaz', () => {
    const artists = pickPopularArtists([
      event({
        id: 'match-1',
        name: 'Crystal Palace V Tottenham',
        localDate: '2026-09-01',
        category: 'Sports',
        status: 'onsale',
        image: 'https://cdn.example/crystal-palace-poster.jpg',
        attractions: [
          { name: 'Crystal Palace', image: 'https://cdn.example/crystal-palace-poster.jpg' },
          { name: 'Tottenham Hotspur', image: 'https://cdn.example/crystal-palace-poster.jpg' }
        ]
      }),
      event({
        id: 'match-2',
        name: 'Tottenham V Arsenal',
        localDate: '2026-10-01',
        category: 'Sports',
        status: 'onsale',
        image: 'https://cdn.example/spurs-poster.jpg',
        attractions: [
          { name: 'Tottenham Hotspur', image: 'https://cdn.example/tottenham-logo.jpg' },
          { name: 'Arsenal', image: 'https://cdn.example/arsenal-logo.jpg' }
        ]
      })
    ], 5)

    const spurs = artists.find(a => a.name === 'Tottenham Hotspur')
    expect(spurs?.image).toBe('https://cdn.example/tottenham-logo.jpg')
    expect(spurs?.image).not.toBe('https://cdn.example/crystal-palace-poster.jpg')
  })

  it('kategoriler arasında karışık sonuç üretir', () => {
    const pool: EventSummary[] = []
    for (let i = 0; i < 5; i++) {
      pool.push(event({
        id: `m-${i}`,
        name: `Music ${i}`,
        localDate: '2026-09-10',
        category: 'Music',
        status: 'onsale',
        attractions: [{ name: `Band ${i}`, genre: 'Rock', image: `https://cdn.example/band-${i}.jpg` }]
      }))
      pool.push(event({
        id: `s-${i}`,
        name: `Sport ${i}`,
        localDate: '2026-09-12',
        category: 'Sports',
        status: 'onsale',
        attractions: [{ name: `Team ${i}`, genre: 'Football', image: `https://cdn.example/team-${i}.jpg` }]
      }))
      pool.push(event({
        id: `a-${i}`,
        name: `Arts ${i}`,
        localDate: '2026-09-14',
        category: 'Arts & Theatre',
        status: 'onsale',
        attractions: [{ name: `Show ${i}`, genre: 'Theatre', image: `https://cdn.example/show-${i}.jpg` }]
      }))
    }

    const artists = pickPopularArtists(pool, 6)
    const names = artists.map(a => a.name).join(' ')
    expect(names).toMatch(/Band/)
    expect(names).toMatch(/Team/)
    expect(names).toMatch(/Show/)
  })
})
