import type { EventDetail, EventListResult, EventSummary } from '#shared/types/event'
import { pickSimilarEvents, toSimilarEventsQuery } from '#shared/utils/similarEvents'

const POOL_SIZE = 32
const RESULT_LIMIT = 4

/**
 * Detay sayfası için benzer etkinlikler — aynı Discovery list API’si.
 * `deferred` true olana kadar istek atmaz (ilk boyamayı bloklamaz).
 */
export function useSimilarEvents(
  event: MaybeRefOrGetter<EventDetail | null | undefined>,
  options?: { deferred?: MaybeRefOrGetter<boolean> }
) {
  const similar = ref<EventSummary[]>([])
  const pending = ref(false)
  const error = ref<unknown>(null)

  const deferredReady = computed(() =>
    options?.deferred === undefined ? true : Boolean(toValue(options.deferred))
  )

  const canQuery = computed(() => {
    const current = toValue(event)
    return Boolean(current?.id && toSimilarEventsQuery(current))
  })

  async function refresh() {
    const current = toValue(event)
    if (!deferredReady.value || !current?.id) {
      if (!deferredReady.value) {
        return
      }
      similar.value = []
      error.value = null
      pending.value = false
      return
    }

    const base = toSimilarEventsQuery(current)
    if (!base) {
      similar.value = []
      error.value = null
      pending.value = false
      return
    }

    pending.value = true
    error.value = null

    try {
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

      similar.value = pickSimilarEvents(data.events ?? [], {
        excludeId: latest.id,
        excludeName: latest.name,
        preferCity: latest.city,
        limit: RESULT_LIMIT
      })
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
      if (!current?.id) return ''
      return `${deferredReady.value}|${current.id}|${current.category || ''}|${current.genre || ''}|${current.city || ''}`
    },
    () => {
      void refresh()
    },
    { immediate: true }
  )

  const waiting = computed(() =>
    canQuery.value && (!deferredReady.value || pending.value)
  )

  const visible = computed(() =>
    canQuery.value
    && (waiting.value || Boolean(error.value) || similar.value.length > 0)
  )

  return {
    similar,
    pending: waiting,
    error,
    empty: computed(() =>
      canQuery.value
      && deferredReady.value
      && !pending.value
      && !error.value
      && similar.value.length === 0
    ),
    visible,
    refresh
  }
}
