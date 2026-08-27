import { pickPopularArtists } from '#shared/utils/popularArtists'

const DEFAULT_LIMIT = 12
/** API sayfa boyutu 20 ile sınırlı; 4 sayfa ≈ 80 müzik etkinliği */
const DEFAULT_POOL_SIZE = 80
const PAGE_SIZE = 20

/**
 * Popüler sanatçılar yalnızca Music kategorisindeki yaklaşan etkinliklerden türetilir.
 * EventFilters / keşif ile aynı `classificationName: 'Music'` parametresi kullanılır.
 */
export function usePopularArtists(options?: { limit?: number, poolSize?: number }) {
  const limit = options?.limit ?? DEFAULT_LIMIT
  const poolSize = options?.poolSize ?? DEFAULT_POOL_SIZE
  const pageCount = Math.max(1, Math.ceil(poolSize / PAGE_SIZE))

  const pools = Array.from({ length: pageCount }, (_, index) =>
    useEvents({
      classificationName: 'Music',
      sort: 'date,asc',
      size: PAGE_SIZE,
      page: index + 1
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
