import type { EventDetail, EventSummary, FavoriteEvent, VenueSummary } from '#shared/types/event'

function fallbackVenueDetail(summary: EventSummary | FavoriteEvent): VenueSummary | undefined {
  if (!summary.venue) {
    return undefined
  }

  return {
    id: summary.venueId,
    name: summary.venue,
    city: summary.city,
    country: summary.country,
    address: [summary.city, summary.country].filter(Boolean).join(', ') || undefined
  }
}

/**
 * Liste/karttan detaya geçerken mümkün olan her alanı anında göstermek için önizleme.
 * Tam API cevabı gelince useEvent bunu ezer.
 */
export function summaryToEventPreview(summary: EventSummary | FavoriteEvent): EventDetail {
  const url = summary.url
  const attractions = 'attractions' in summary ? (summary.attractions ?? []) : []
  const genre = 'genre' in summary ? summary.genre : undefined
  const status = 'status' in summary ? summary.status : undefined

  return {
    id: summary.id,
    name: summary.name,
    url,
    image: summary.image,
    dateLabel: summary.dateLabel,
    localDate: summary.localDate,
    localTime: summary.localTime,
    city: summary.city,
    country: summary.country,
    venue: summary.venue,
    venueId: summary.venueId,
    venueDetail: summary.venueDetail ?? fallbackVenueDetail(summary),
    category: summary.category,
    genre,
    priceLabel: summary.priceLabel,
    status,
    ticketUrl: url,
    attractions,
    images: summary.image ? [summary.image] : []
  }
}

export function useEventPreview() {
  const preview = useState<EventDetail | null>('event-detail-preview', () => null)

  function seedFromSummary(summary: EventSummary | FavoriteEvent | null | undefined) {
    if (!summary?.id) {
      return
    }
    preview.value = summaryToEventPreview(summary)
  }

  function clearPreview(id?: string) {
    if (!preview.value) {
      return
    }
    if (!id || preview.value.id === id) {
      preview.value = null
    }
  }

  return {
    preview,
    seedFromSummary,
    clearPreview
  }
}
