import type { VenueSummary } from '#shared/types/event'

export function useVenue(id: MaybeRefOrGetter<string | undefined>) {
  const venueId = computed(() => toValue(id))

  const { data, pending, error, refresh } = useAsyncData<VenueSummary | null>(
    () => venueId.value ? `venue-${venueId.value}` : 'venue-none',
    async () => {
      if (!venueId.value) {
        return null
      }

      return await $fetch<VenueSummary>(`/api/venues/${encodeURIComponent(venueId.value)}`)
    },
    {
      watch: [venueId]
    }
  )

  return {
    venue: data,
    pending,
    error,
    refresh
  }
}

export function useVenues() {
  return {
    useVenue
  }
}
