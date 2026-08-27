import type { VenueSummary } from '#shared/types/event'

export function useVenue(
  id: MaybeRefOrGetter<string | undefined>,
  options?: { enabled?: MaybeRefOrGetter<boolean> }
) {
  const venueId = computed(() => toValue(id))
  const enabled = computed(() => {
    if (options?.enabled !== undefined) {
      return Boolean(toValue(options.enabled) && venueId.value)
    }
    return Boolean(venueId.value)
  })
  const nuxtApp = useNuxtApp()

  const { data, pending, error, refresh } = useAsyncData<VenueSummary | null>(
    () => enabled.value && venueId.value ? `venue-${venueId.value}` : 'venue-none',
    async () => {
      if (!enabled.value || !venueId.value) {
        return null
      }

      return await $fetch<VenueSummary>(`/api/venues/${encodeURIComponent(venueId.value)}`, {
        query: { locale: '1' }
      })
    },
    {
      watch: [venueId, enabled],
      lazy: true,
      server: false,
      dedupe: 'defer',
      getCachedData(key) {
        return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
      }
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
