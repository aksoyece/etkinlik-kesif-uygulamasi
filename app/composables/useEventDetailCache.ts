import type { EventDetail } from '#shared/types/event'

const TTL_MS = 1000 * 60 * 20

type CacheEntry = { data: EventDetail, at: number }

const memoryCache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<EventDetail>>()
const localeInflight = new Set<string>()
const localeDone = new Set<string>()

function cacheKey(id: string) {
  return `event-${id}`
}

function readMemory(id: string): EventDetail | undefined {
  const entry = memoryCache.get(id)
  if (!entry) {
    return undefined
  }
  if (Date.now() - entry.at > TTL_MS) {
    memoryCache.delete(id)
    return undefined
  }
  return entry.data
}

function writeMemory(id: string, data: EventDetail) {
  memoryCache.set(id, { data, at: Date.now() })
}

function syncPayload(id: string, data: EventDetail) {
  if (!import.meta.client) {
    return
  }
  try {
    const nuxtApp = useNuxtApp()
    nuxtApp.payload.data[cacheKey(id)] = data
  } catch {
    // Nuxt context yoksa sessiz geç
  }
}

function readPayload(id: string): EventDetail | undefined {
  if (!import.meta.client) {
    return undefined
  }
  try {
    const nuxtApp = useNuxtApp()
    const key = cacheKey(id)
    return (nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]) as EventDetail | undefined
  } catch {
    return undefined
  }
}

/** Aynı event ID için tek uçuş + bellek/payload cache */
export function getCachedEventDetail(id: string): EventDetail | undefined {
  return readMemory(id) ?? readPayload(id)
}

export function getEventDetailInflight(id: string): Promise<EventDetail> | undefined {
  return inflight.get(id)
}

export function setCachedEventDetail(id: string, data: EventDetail) {
  writeMemory(id, data)
  syncPayload(id, data)
}

/** Kabuk geldikten sonra prose çevirisini arka planda çeker (bir kez) */
export async function enrichEventLocale(
  id: string,
  onUpdate?: (data: EventDetail) => void
): Promise<EventDetail | undefined> {
  if (!id || localeDone.has(id) || localeInflight.has(id)) {
    return undefined
  }

  localeInflight.add(id)
  try {
    const full = await $fetch<EventDetail>(`/api/events/${encodeURIComponent(id)}`, {
      query: { locale: '1' }
    })
    localeDone.add(id)
    setCachedEventDetail(id, full)
    onUpdate?.(full)
    return full
  } catch {
    return undefined
  } finally {
    localeInflight.delete(id)
  }
}

export async function fetchEventDetailCached(id: string): Promise<EventDetail> {
  const hit = getCachedEventDetail(id)
  if (hit) {
    return hit
  }

  const existing = inflight.get(id)
  if (existing) {
    return existing
  }

  // Kabuk: çevirisiz — mekan/adres/seatmap hızlı
  const request = $fetch<EventDetail>(`/api/events/${encodeURIComponent(id)}`)
    .then((data) => {
      writeMemory(id, data)
      syncPayload(id, data)
      return data
    })
    .finally(() => {
      inflight.delete(id)
    })

  inflight.set(id, request)
  return request
}

export function warmEventDetailCache(id: string) {
  if (!import.meta.client || !id) {
    return
  }
  if (getCachedEventDetail(id) || inflight.has(id)) {
    return
  }
  void fetchEventDetailCached(id)
}
