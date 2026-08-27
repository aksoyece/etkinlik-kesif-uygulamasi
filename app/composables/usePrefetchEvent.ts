/**
 * Kart tıklamasında (pointerdown) detay API’sini ısıtır.
 * Hover’da toplu prefetch yapmaz — çeviri + TM yükünü şişiriyordu.
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
      return data
    })
    .catch(() => undefined)
    .finally(() => {
      // Kısa süre map’te tutma — useEvent aynı promise’i paylaşabilsin diye
      // silmeyi geciktirme: navigasyon aynı anda başlar
      queueMicrotask(() => {
        // Veri payload’a yazıldıysa map’ten düşürülebilir
        if (nuxtApp.payload.data[key]) {
          bucket._eventDetailPrefetch?.delete(key)
        }
      })
    })

  bucket._eventDetailPrefetch.set(key, request)
}

export function getEventDetailPrefetch(id: string): Promise<unknown> | undefined {
  if (!import.meta.client || !id) {
    return undefined
  }
  const nuxtApp = useNuxtApp() as ReturnType<typeof useNuxtApp> & {
    _eventDetailPrefetch?: Map<string, Promise<unknown>>
  }
  return nuxtApp._eventDetailPrefetch?.get(`event-${id}`)
}
