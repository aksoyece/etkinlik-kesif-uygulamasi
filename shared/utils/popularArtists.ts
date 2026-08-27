import type { EventSummary, PopularArtist } from '../types/event'
import { EVENT_IMAGE_PLACEHOLDER } from './event'

function normalizeArtistName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

function isUsableEvent(event: EventSummary): boolean {
  const status = (event.status || 'onsale').toLowerCase()
  return status !== 'cancelled' && status !== 'offsale'
}

function resolveLabel(attractionGenre?: string, eventGenre?: string, eventCategory?: string): string {
  const raw = attractionGenre || eventGenre || eventCategory || 'Genel'
  if (raw.toUpperCase() === 'UNDEFINED') return 'Genel'
  return raw
}

function isRealImage(url?: string): boolean {
  return Boolean(url) && url !== EVENT_IMAGE_PLACEHOLDER
}

/**
 * Yaklaşan etkinliklerden popüler sanatçı / attraction listesi üretir.
 * Sıra: daha çok etkinlikte geçenler önce; eşitlikte en yakın tarih önce.
 */
export function pickPopularArtists(events: EventSummary[], limit = 12): PopularArtist[] {
  type Acc = {
    id: string
    name: string
    image?: string
    label: string
    eventCount: number
    soonestDate?: string
    eventIds: Set<string>
  }

  const byName = new Map<string, Acc>()

  for (const event of events) {
    if (!isUsableEvent(event)) continue

    const attractions = event.attractions ?? []
    for (const attraction of attractions) {
      const name = attraction.name?.trim()
      if (!name || name.toUpperCase() === 'UNDEFINED') continue

      const key = normalizeArtistName(name)
      const existing = byName.get(key)
      const label = resolveLabel(attraction.genre, event.genre, event.category)
      const image = isRealImage(attraction.image)
        ? attraction.image
        : (isRealImage(event.image) ? event.image : undefined)

      if (!existing) {
        byName.set(key, {
          id: attraction.id || key,
          name,
          image,
          label,
          eventCount: 1,
          soonestDate: event.localDate,
          eventIds: new Set([event.id])
        })
        continue
      }

      if (!existing.eventIds.has(event.id)) {
        existing.eventIds.add(event.id)
        existing.eventCount += 1
      }

      if (!isRealImage(existing.image) && image) {
        existing.image = image
      }

      if (event.localDate) {
        if (!existing.soonestDate || event.localDate < existing.soonestDate) {
          existing.soonestDate = event.localDate
          // En yakın etkinliğin türünü etiket olarak tercih et
          existing.label = label
        }
      }
    }
  }

  return [...byName.values()]
    .sort((a, b) => {
      if (b.eventCount !== a.eventCount) {
        return b.eventCount - a.eventCount
      }
      const dateA = a.soonestDate || '9999-99-99'
      const dateB = b.soonestDate || '9999-99-99'
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB)
      }
      return a.name.localeCompare(b.name, 'tr')
    })
    .slice(0, limit)
    .map(({ eventIds: _ids, ...artist }) => artist)
}
