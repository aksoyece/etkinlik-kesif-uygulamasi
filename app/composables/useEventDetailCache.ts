import type { EventDetail, EventRawProse } from '#shared/types/event'

const TTL_MS = 1000 * 60 * 20

type CacheEntry = { data: EventDetail, at: number }

const memoryCache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<EventDetail>>()
const localeInflight = new Map<string, Promise<EventDetail | undefined>>()
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

export function hasPendingProse(detail: EventDetail | null | undefined): boolean {
  if (!detail?.pendingProse) {
    return false
  }
  return Object.values(detail.pendingProse).some(Boolean)
}

/** Çeviri isteği başarısız olursa ham İngilizceyi gösterilebilir hale getir */
export function applyRawProseFallback(detail: EventDetail): EventDetail {
  const raw: EventRawProse | undefined = detail.rawProse
  if (!raw) {
    return {
      ...detail,
      pendingProse: undefined,
      rawProse: undefined
    }
  }

  return {
    ...detail,
    info: raw.info,
    pleaseNote: raw.pleaseNote,
    venueDetail: detail.venueDetail
      ? {
          ...detail.venueDetail,
          parkingDetail: raw.parkingDetail,
          generalRule: raw.generalRule,
          childRule: raw.childRule,
          accessibilityDetail: raw.accessibilityDetail,
          boxOffice: raw.boxOffice
        }
      : detail.venueDetail,
    pendingProse: undefined,
    rawProse: undefined
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
  if (!hasPendingProse(data)) {
    localeDone.add(id)
  }
}

/** Kabuk geldikten sonra prose çevirisini arka planda çeker */
export async function enrichEventLocale(
  id: string,
  onUpdate?: (data: EventDetail) => void
): Promise<EventDetail | undefined> {
  if (!id) {
    return undefined
  }

  if (localeDone.has(id)) {
    const cached = getCachedEventDetail(id)
    if (cached && !hasPendingProse(cached)) {
      onUpdate?.(cached)
      return cached
    }
  }

  const existing = localeInflight.get(id)
  if (existing) {
    const result = await existing
    if (result) {
      onUpdate?.(result)
    }
    return result
  }

  const request = $fetch<EventDetail>(`/api/events/${encodeURIComponent(id)}`, {
    query: { locale: '1' }
  })
    .then((full) => {
      localeDone.add(id)
      setCachedEventDetail(id, full)
      onUpdate?.(full)
      return full
    })
    .catch(() => undefined)
    .finally(() => {
      localeInflight.delete(id)
    })

  localeInflight.set(id, request)
  return request
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

  // Kabuk: prose metinsiz — language flash yok
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
