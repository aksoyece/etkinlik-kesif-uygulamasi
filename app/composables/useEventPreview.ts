import type { EventDetail, EventSummary } from '#shared/types/event'

/**
 * Liste/karttan detaya geçerken ana bilgileri anında göstermek için önizleme.
 * Tam API cevabı gelince useEvent bunu ezer.
 */
export function summaryToEventPreview(summary: EventSummary): EventDetail {
  const address = [summary.city, summary.country].filter(Boolean).join(', ') || undefined

  return {
    ...summary,
    ticketUrl: summary.url,
    attractions: summary.attractions ?? [],
    images: summary.image ? [summary.image] : [],
    venueDetail: summary.venue
      ? {
          id: summary.venueId,
          name: summary.venue,
          city: summary.city,
          country: summary.country,
          // Adres + harita linki karttan hemen; sokak satırı kabuk API ile gelir
          address
        }
      : undefined
  }
}

export function useEventPreview() {
  const preview = useState<EventDetail | null>('event-detail-preview', () => null)

  function seedFromSummary(summary: EventSummary | null | undefined) {
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
