import type { EventDetail, EventListResult, EventSummary } from '#shared/types/event'
import { pickSimilarEvents, toSimilarEventsQuery } from '#shared/utils/similarEvents'

/** Tek sayfa, sınırlı havuz — ek sayfa / recursive istek yok */
const POOL_SIZE = 20
const RESULT_LIMIT = 4

const similarCache = new Map<string, EventSummary[]>()

/**
 * Benzer etkinlikler — asla useAsyncData/useFetch ile page setup’ı bloklamaz.
 * Yalnızca `enabled` true iken (sayfa boyandıktan sonra) tek $fetch atar.
 */
export function useSimilarEvents(
  event: MaybeRefOrGetter<EventDetail | null | undefined>,
  options?: { enabled?: MaybeRefOrGetter<boolean> }
) {
  const similar = ref<EventSummary[]>([])
  const pending = ref(false)
  const error = ref<unknown>(null)
  const started = ref(false)

  const enabled = computed(() =>
    options?.enabled === undefined ? true : Boolean(toValue(options.enabled))
  )

  const canQuery = computed(() => {
    const current = toValue(event)
    return Boolean(current?.id && toSimilarEventsQuery(current))
  })

  async function refresh() {
    const current = toValue(event)
    if (!enabled.value || !current?.id) {
      return
    }

    const base = toSimilarEventsQuery(current)
    if (!base) {
      similar.value = []
      error.value = null
      pending.value = false
      return
    }

    const cacheKey = `${current.id}|${current.category || ''}|${current.genre || ''}|${current.city || ''}`
    const cached = similarCache.get(cacheKey)
    if (cached) {
      similar.value = cached
      error.value = null
      pending.value = false
      started.value = true
      return
    }

    pending.value = true
    error.value = null
    started.value = true

    try {
      // Tek istek — page>1 yok, recursive yok
      const data = await $fetch<EventListResult>('/api/events', {
        query: {
          ...base,
          sort: 'relevance,desc',
          size: POOL_SIZE,
          page: 1
        }
      })

      const latest = toValue(event)
      if (!latest?.id || latest.id !== current.id) {
        return
      }

      const picked = pickSimilarEvents(data.events ?? [], {
        excludeId: latest.id,
        excludeName: latest.name,
        preferCity: latest.city,
        limit: RESULT_LIMIT
      })

      similarCache.set(cacheKey, picked)
      similar.value = picked
    } catch (err) {
      error.value = err
      similar.value = []
    } finally {
      pending.value = false
    }
  }

  watch(
    () => {
      const current = toValue(event)
      if (!enabled.value || !current?.id) {
        return ''
      }
      return `${enabled.value}|${current.id}|${current.category || ''}|${current.genre || ''}`
    },
    (key) => {
      if (!key) {
        return
      }
      void refresh()
    },
    { flush: 'post', immediate: true }
  )

  const waiting = computed(() =>
    canQuery.value && enabled.value && (pending.value || (!started.value && similar.value.length === 0 && !error.value))
  )

  // enabled olana kadar bölüm hiç görünmesin (ana içeriği bekletmez)
  const visible = computed(() =>
    enabled.value
    && canQuery.value
    && (waiting.value || Boolean(error.value) || similar.value.length > 0)
  )

  return {
    similar,
    pending: waiting,
    error,
    empty: computed(() =>
      canQuery.value
      && enabled.value
      && started.value
      && !pending.value
      && !error.value
      && similar.value.length === 0
    ),
    visible,
    refresh
  }
}
