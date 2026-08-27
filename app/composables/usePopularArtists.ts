import { pickPopularArtists } from '#shared/utils/popularArtists'

const DEFAULT_LIMIT = 12
const PER_CATEGORY_SIZE = 12

/** Ticketmaster segment’leri — aile/müze ağırlıklı “date,asc” havuzunu dengelemek için */
const ARTIST_CATEGORIES = ['Music', 'Sports', 'Arts & Theatre', 'Family'] as const

/**
 * Liste API’sindeki yaklaşan etkinliklerden popüler sanatçıları türetir.
 * Her ana kategoriden ayrı havuz çeker; tek bir “trending” endpoint kullanmaz.
 */
export function usePopularArtists(options?: { limit?: number }) {
  const limit = options?.limit ?? DEFAULT_LIMIT

  const pools = ARTIST_CATEGORIES.map(classificationName =>
    useEvents({
      classificationName,
      sort: 'relevance,desc',
      size: PER_CATEGORY_SIZE,
      page: 1
    })
  )

  const pending = computed(() => pools.some(pool => pool.pending.value))
  const error = computed(() => pools.find(pool => pool.error.value)?.error.value ?? null)

  const events = computed(() => {
    const merged = pools.flatMap(pool => pool.events.value)
    const seen = new Set<string>()
    return merged.filter((event) => {
      if (seen.has(event.id)) return false
      seen.add(event.id)
      return true
    })
  })

  const artists = computed(() => pickPopularArtists(events.value, limit))
  const empty = computed(() => !pending.value && !error.value && artists.value.length === 0)

  async function refresh() {
    await Promise.all(pools.map(pool => pool.refresh()))
  }

  return {
    artists,
    pending,
    error,
    empty,
    refresh
  }
}
