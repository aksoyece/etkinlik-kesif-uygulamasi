import type { EventDetail, EventListResult, EventSummary } from '#shared/types/event'
import { pickSimilarEvents, toSimilarEventsQuery } from '#shared/utils/similarEvents'

const POOL_SIZE = 16
const RESULT_LIMIT = 4

/**
 * Detay sayfası için benzer etkinlikler — aynı Discovery list API’si.
 */
export function useSimilarEvents(event: MaybeRefOrGetter<EventDetail | null | undefined>) {
  const similar = ref<EventSummary[]>([])
  const pending = ref(false)
  const error = ref<unknown>(null)

  const enabled = computed(() => {
    const current = toValue(event)
    return Boolean(current?.id && toSimilarEventsQuery(current))
  })

  async function refresh() {
    const current = toValue(event)
    if (!current?.id) {
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

      // Event değişmiş olabilir
      const latest = toValue(event)
      if (!latest?.id || latest.id !== current.id) {
        return
      }

      similar.value = pickSimilarEvents(data.events ?? [], {
        excludeId: latest.id,
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
      return `${current.id}|${current.category || ''}|${current.genre || ''}|${current.city || ''}`
    },
    () => {
      void refresh()
    },
    { immediate: true }
  )

  const empty = computed(() =>
    enabled.value && !pending.value && !error.value && similar.value.length === 0
  )

  const visible = computed(() =>
    enabled.value && (pending.value || Boolean(error.value) || similar.value.length > 0)
  )

  return {
    similar,
    pending,
    error,
    empty,
    visible,
    refresh
  }
}
