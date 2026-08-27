/**
 * Kart hover/focus sırasında detay API’sini ısıtır;
 * useEvent getCachedData ile anında gösterir.
 */
export function prefetchEventDetail(id: string | undefined | null) {
  if (!import.meta.client || !id) {
    return
  }

  const nuxtApp = useNuxtApp()
  const key = `event-${id}`

  if (nuxtApp.payload.data[key] || nuxtApp.static.data[key]) {
    return
  }

  const bucket = nuxtApp as typeof nuxtApp & {
    _eventDetailPrefetch?: Map<string, Promise<unknown>>
  }
  if (!bucket._eventDetailPrefetch) {
    bucket._eventDetailPrefetch = new Map()
  }

  if (bucket._eventDetailPrefetch.has(key)) {
    return
  }

  const request = $fetch(`/api/events/${encodeURIComponent(id)}`)
    .then((data) => {
      nuxtApp.payload.data[key] = data
    })
    .catch(() => {
      // Prefetch başarısız olursa navigasyonda normal istek yapılır
    })
    .finally(() => {
      bucket._eventDetailPrefetch?.delete(key)
    })

  bucket._eventDetailPrefetch.set(key, request)
}
