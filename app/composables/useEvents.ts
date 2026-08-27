import type { FormSubmitEvent } from '@nuxt/ui'
import type { EventFilterState, EventListResult, EventSearchParams } from '~/types/event'
import {
  defaultFilterState,
  eventFilterSchema,
  filtersFromQuery,
  filtersToQuery,
  ALL_FILTER_VALUE,
  PAGE_SIZE,
  toSearchParams
} from '#shared/utils/filters'
import { writeLastCity } from '#shared/utils/event'

export function useEvents(params: MaybeRefOrGetter<EventSearchParams>) {
  const query = computed(() => {
    const value = toValue(params)

    return {
      keyword: value.keyword || undefined,
      city: value.city || undefined,
      classificationName: value.classificationName || undefined,
      startDate: value.startDate || undefined,
      endDate: value.endDate || undefined,
      sort: value.sort || 'date,asc',
      page: value.page || 1,
      size: value.size || PAGE_SIZE
    }
  })

  const { data, pending, error, refresh, status } = useFetch<EventListResult>('/api/events', {
    query,
    watch: [query],
    lazy: true
  })

  const events = computed(() => data.value?.events ?? [])
  const total = computed(() => data.value?.total ?? 0)
  const totalPages = computed(() => data.value?.totalPages ?? 0)
  const page = computed(() => data.value?.page ?? query.value.page ?? 1)
  const empty = computed(() => status.value !== 'pending' && !error.value && events.value.length === 0)

  return {
    data,
    events,
    total,
    totalPages,
    page,
    pending,
    error,
    empty,
    refresh
  }
}

export function useEvent(id: MaybeRefOrGetter<string>) {
  const eventId = computed(() => toValue(id))
  const nuxtApp = useNuxtApp()

  const { data, pending, error, refresh } = useAsyncData(
    () => `event-${eventId.value}`,
    () => $fetch(`/api/events/${encodeURIComponent(eventId.value)}`),
    {
      watch: [eventId],
      // Route geçişini API bitene kadar bloklama
      lazy: true,
      server: true,
      dedupe: 'defer',
      getCachedData(key) {
        return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
      }
    }
  )

  return {
    event: data,
    pending,
    error,
    refresh
  }
}

export function useEventExplorer() {
  const route = useRoute()
  const router = useRouter()

  const state = reactive<EventFilterState>(filtersFromQuery(route.query))

  watch(() => route.query, (query) => {
    Object.assign(state, filtersFromQuery(query))
  })

  const page = computed(() => Math.max(1, Number(route.query.page) || 1))
  const params = computed(() => toSearchParams(filtersFromQuery(route.query), page.value))
  const { events, pending, error, empty, total, refresh } = useEvents(params)

  const errorMessage = computed(() => {
    const value = error.value as { statusMessage?: string, message?: string } | null
    return value?.statusMessage || value?.message || null
  })

  function apply(filters: EventFilterState, nextPage = 1) {
    if (filters.city && filters.city !== ALL_FILTER_VALUE) {
      writeLastCity(filters.city)
    }

    return router.push({
      query: filtersToQuery(filters, nextPage)
    })
  }

  async function onSubmit(_event?: FormSubmitEvent<EventFilterState>) {
    await apply({ ...state }, 1)
  }

  async function reset() {
    Object.assign(state, defaultFilterState())
    await apply(state, 1)
  }

  async function onPageChange(nextPage: number) {
    await apply(filtersFromQuery(route.query), nextPage)
  }

  return {
    state,
    schema: eventFilterSchema,
    page,
    events,
    pending,
    empty,
    total,
    errorMessage,
    refresh,
    onSubmit,
    reset,
    onPageChange
  }
}
