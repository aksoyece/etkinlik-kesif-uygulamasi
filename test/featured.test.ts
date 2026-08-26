import { describe, expect, it } from 'vitest'
import type { EventSummary } from '../app/types/event'
import { pickDistinctFeatured } from '../shared/utils/featured'

function event(partial: Partial<EventSummary> & Pick<EventSummary, 'id' | 'name'>): EventSummary {
  return {
    dateLabel: 'TBD',
    ...partial
  }
}

describe('öne çıkan seçimi', () => {
  it('offsale ve cancelled etkinlikleri öncelikli seçmez', () => {
    const pool = [
      event({ id: '1', name: 'A', image: 'https://img/a.jpg', status: 'cancelled' }),
      event({ id: '2', name: 'B', image: 'https://img/b.jpg', status: 'offsale' }),
      event({ id: '3', name: 'C', image: 'https://img/c.jpg', status: 'onsale' }),
      event({ id: '4', name: 'D', image: 'https://img/d.jpg', status: 'onsale' }),
      event({ id: '5', name: 'E', image: 'https://img/e.jpg', status: 'onsale' })
    ]

    const picked = pickDistinctFeatured(pool, 3)
    expect(picked.map(e => e.id)).toEqual(['3', '4', '5'])
  })

  it('aynı görseli tekrar etmez', () => {
    const pool = [
      event({ id: '1', name: 'A', image: 'https://cdn.example/x_SOURCE.jpg', status: 'onsale' }),
      event({ id: '2', name: 'B', image: 'https://cdn.example/x_RETINA_LANDSCAPE_16_9.jpg', status: 'onsale' }),
      event({ id: '3', name: 'C', image: 'https://cdn.example/y.jpg', status: 'onsale' }),
      event({ id: '4', name: 'D', image: 'https://cdn.example/z.jpg', status: 'onsale' })
    ]

    const picked = pickDistinctFeatured(pool, 3)
    expect(picked).toHaveLength(3)
    expect(picked.map(e => e.id)).toEqual(['1', '3', '4'])
  })
})
