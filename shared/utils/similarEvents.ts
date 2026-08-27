import type { EventSummary } from '../types/event'
import { isVagueCategory } from './labels'

export interface SimilarEventsOptions {
  excludeId: string
  preferCity?: string
  limit?: number
}

/**
 * Aynı kategoriden gelen havuzdan benzer etkinlik seçer.
 * Önce aynı şehir, sonra diğerleri; mevcut etkinlik hariç.
 */
export function pickSimilarEvents(
  pool: EventSummary[],
  options: SimilarEventsOptions
): EventSummary[] {
  const limit = options.limit ?? 4
  const preferCity = options.preferCity?.trim().toLowerCase()
  const excludeId = options.excludeId

  const usable = pool.filter((event) => {
    if (!event.id || event.id === excludeId) return false
    const status = (event.status || 'onsale').toLowerCase()
    return status !== 'cancelled' && status !== 'offsale'
  })

  const preferred: EventSummary[] = []
  const rest: EventSummary[] = []

  for (const event of usable) {
    if (preferCity && event.city?.trim().toLowerCase() === preferCity) {
      preferred.push(event)
    } else {
      rest.push(event)
    }
  }

  return [...preferred, ...rest].slice(0, limit)
}

/** Benzer etkinlik API sorgusu — vague segment’te Family/genre’ye düşer */
export function toSimilarEventsQuery(event: {
  category?: string
  genre?: string
}): { classificationName?: string, keyword?: string } | null {
  if (event.category && !isVagueCategory(event.category)) {
    return { classificationName: event.category }
  }

  const genre = event.genre?.trim()
  if (!genre || genre.toUpperCase() === 'UNDEFINED') {
    return null
  }

  if (/^family$/i.test(genre) || /family/i.test(genre)) {
    return { classificationName: 'Family' }
  }

  return { keyword: genre }
}
