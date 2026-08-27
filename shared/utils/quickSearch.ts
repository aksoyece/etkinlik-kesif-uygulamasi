import type { EventSummary } from '../types/event'
import { EVENT_IMAGE_PLACEHOLDER } from './event'

export type QuickSearchResultType = 'artist' | 'event' | 'venue'

export interface QuickSearchResult {
  id: string
  type: QuickSearchResultType
  name: string
  /** Satır altı: "Sanatçı", "Etkinlik · London", "Mekan · Manchester" */
  subtitle: string
  image?: string
  icon: string
  /** Sanatçı/mekan: keyword araması; etkinlik: detay path */
  href: string
}

export interface QuickSearchOptions {
  maxTotal?: number
  maxPerType?: number
  minQueryLength?: number
}

const DEFAULT_MAX_TOTAL = 6
const DEFAULT_MAX_PER_TYPE = 2

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function matches(haystack: string | undefined, needle: string): boolean {
  if (!haystack) return false
  return normalize(haystack).includes(needle)
}

function scoreMatch(name: string, needle: string): number {
  const n = normalize(name)
  if (n === needle) return 0
  if (n.startsWith(needle)) return 1
  return 2
}

function slugId(prefix: string, value: string): string {
  return `${prefix}-${value.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'item'}`
}

function isRealImage(url?: string): boolean {
  return Boolean(url) && url !== EVENT_IMAGE_PLACEHOLDER
}

/**
 * Cache’li etkinlik havuzundan sanatçı / etkinlik / mekan önerileri üretir.
 * Tip başına en fazla maxPerType, toplamda maxTotal sonuç.
 */
export function buildQuickSearchResults(
  events: EventSummary[],
  query: string,
  options: QuickSearchOptions = {}
): QuickSearchResult[] {
  const maxTotal = options.maxTotal ?? DEFAULT_MAX_TOTAL
  const maxPerType = options.maxPerType ?? DEFAULT_MAX_PER_TYPE
  const minLen = options.minQueryLength ?? 2
  const needle = normalize(query)

  if (needle.length < minLen) {
    return []
  }

  const artists: QuickSearchResult[] = []
  const artistSeen = new Set<string>()
  const eventHits: QuickSearchResult[] = []
  const venues: QuickSearchResult[] = []
  const venueSeen = new Set<string>()

  for (const event of events) {
    if (matches(event.name, needle)) {
      eventHits.push({
        id: slugId('event', event.id),
        type: 'event',
        name: event.name,
        subtitle: event.city ? `Etkinlik · ${event.city}` : 'Etkinlik',
        image: isRealImage(event.image) ? event.image : undefined,
        icon: 'i-lucide-calendar',
        href: `/events/${event.id}`
      })
    }

    for (const attraction of event.attractions ?? []) {
      const key = normalize(attraction.name)
      if (!key || artistSeen.has(key) || !matches(attraction.name, needle)) {
        continue
      }
      artistSeen.add(key)
      artists.push({
        id: slugId('artist', attraction.id || key),
        type: 'artist',
        name: attraction.name,
        subtitle: 'Sanatçı',
        image: isRealImage(attraction.image)
          ? attraction.image
          : (isRealImage(event.image) ? event.image : undefined),
        icon: 'i-lucide-mic',
        href: `/events?keyword=${encodeURIComponent(attraction.name)}`
      })
    }

    if (event.venue && matches(event.venue, needle)) {
      const key = `${normalize(event.venue)}|${normalize(event.city || '')}`
      if (!venueSeen.has(key)) {
        venueSeen.add(key)
        venues.push({
          id: slugId('venue', event.venueId || key),
          type: 'venue',
          name: event.venue,
          subtitle: event.city ? `Mekan · ${event.city}` : 'Mekan',
          image: undefined,
          icon: 'i-lucide-map-pin',
          href: `/events?keyword=${encodeURIComponent(event.venue)}`
        })
      }
    }
  }

  const sortByScore = (a: QuickSearchResult, b: QuickSearchResult) =>
    scoreMatch(a.name, needle) - scoreMatch(b.name, needle) || a.name.localeCompare(b.name, 'tr')

  artists.sort(sortByScore)
  eventHits.sort(sortByScore)
  venues.sort(sortByScore)

  const buckets: QuickSearchResult[][] = [
    artists.slice(0, maxPerType),
    eventHits.slice(0, maxPerType),
    venues.slice(0, maxPerType)
  ]

  const selected: QuickSearchResult[] = []
  let index = 0
  while (selected.length < maxTotal) {
    let added = false
    for (const bucket of buckets) {
      if (index < bucket.length) {
        selected.push(bucket[index]!)
        added = true
        if (selected.length >= maxTotal) break
      }
    }
    if (!added) break
    index += 1
  }

  return selected
}
