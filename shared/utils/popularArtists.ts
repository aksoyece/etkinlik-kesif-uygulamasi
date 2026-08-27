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

function categoryBucket(category?: string): string {
  const raw = (category || 'Other').trim()
  if (!raw || raw.toUpperCase() === 'UNDEFINED') return 'Other'
  return raw
}

function isRealImage(url?: string): boolean {
  return Boolean(url) && url !== EVENT_IMAGE_PLACEHOLDER
}

type ArtistAcc = {
  id: string
  name: string
  image?: string
  label: string
  category: string
  eventCount: number
  soonestDate?: string
  eventIds: Set<string>
}

function rankArtists(events: EventSummary[]): ArtistAcc[] {
  const byName = new Map<string, ArtistAcc>()

  for (const event of events) {
    if (!isUsableEvent(event)) continue

    const attractions = event.attractions ?? []
    for (const attraction of attractions) {
      const name = attraction.name?.trim()
      if (!name || name.toUpperCase() === 'UNDEFINED') continue

      const key = normalizeArtistName(name)
      const existing = byName.get(key)
      const label = resolveLabel(attraction.genre, event.genre, event.category)
      const category = categoryBucket(event.category)
      const image = isRealImage(attraction.image)
        ? attraction.image
        : (isRealImage(event.image) ? event.image : undefined)

      if (!existing) {
        byName.set(key, {
          id: attraction.id || key,
          name,
          image,
          label,
          category,
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
          existing.label = label
          existing.category = category
        }
      }
    }
  }

  return [...byName.values()].sort((a, b) => {
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
}

/** Music / Sports / Arts karışımı için round-robin */
function diversifyByCategory(ranked: ArtistAcc[], limit: number): ArtistAcc[] {
  if (ranked.length <= limit) {
    return ranked
  }

  const buckets = new Map<string, ArtistAcc[]>()
  for (const artist of ranked) {
    const key = artist.category
    const list = buckets.get(key)
    if (list) list.push(artist)
    else buckets.set(key, [artist])
  }

  const keys = [...buckets.keys()]
  const cursor = new Map(keys.map(key => [key, 0]))
  const selected: ArtistAcc[] = []

  while (selected.length < limit) {
    let added = false
    for (const key of keys) {
      const list = buckets.get(key)
      const index = cursor.get(key) ?? 0
      if (!list || index >= list.length) continue
      selected.push(list[index]!)
      cursor.set(key, index + 1)
      added = true
      if (selected.length >= limit) break
    }
    if (!added) break
  }

  return selected
}

/**
 * Yaklaşan etkinliklerden popüler sanatçı / attraction listesi üretir.
 * Sıra: etkinlik sayısı ↓, en yakın tarih ↑; çıktı kategoriler arasında çeşitlendirilir.
 */
export function pickPopularArtists(events: EventSummary[], limit = 12): PopularArtist[] {
  const ranked = rankArtists(events)
  return diversifyByCategory(ranked, limit).map(({ eventIds: _ids, category: _category, ...artist }) => artist)
}
