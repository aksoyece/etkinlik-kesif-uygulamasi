import { pickPopularArtists } from '#shared/utils/popularArtists'

const DEFAULT_LIMIT = 12
const PER_CATEGORY_SIZE = 20

/**
 * UK Discovery havuzundan karışık popüler isimler.
 * Her ana kategoriden relevance ile çekilir; tek kategoriye (özellikle Family evergreen) kilitlenmez.
 */
const POPULAR_CATEGORIES = ['Music', 'Sports', 'Arts & Theatre'] as const

export function usePopularArtists(options?: { limit?: number }) {
  const limit = options?.limit ?? DEFAULT_LIMIT

  const pools = POPULAR_CATEGORIES.map(classificationName =>
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
