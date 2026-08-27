import { pickPopularArtists } from '#shared/utils/popularArtists'

const DEFAULT_POOL_SIZE = 40
const DEFAULT_LIMIT = 12

/**
 * Liste API’sindeki yaklaşan etkinliklerden popüler sanatçıları türetir.
 * Ayrı bir “trending” endpoint kullanmaz.
 */
export function usePopularArtists(options?: { limit?: number, poolSize?: number }) {
  const limit = options?.limit ?? DEFAULT_LIMIT
  const poolSize = options?.poolSize ?? DEFAULT_POOL_SIZE

  const { events, pending, error, refresh } = useEvents({
    sort: 'date,asc',
    size: poolSize,
    page: 1
  })

  const artists = computed(() => pickPopularArtists(events.value, limit))
  const empty = computed(() => !pending.value && !error.value && artists.value.length === 0)

  return {
    artists,
    pending,
    error,
    empty,
    refresh
  }
}
