import type { EventSummary } from '../types/event'
import { EVENT_IMAGE_PLACEHOLDER } from './event'

export interface QuickSearchResult {
  id: string
  name: string
  /** Satır altı: "Etkinlik · London" veya mekan bilgisi */
  subtitle: string
  image?: string
  icon: string
  href: string
}

export const QUICK_SEARCH_DEBOUNCE_MS = 450
export const QUICK_SEARCH_MIN_CHARS = 2
export const QUICK_SEARCH_LIMIT = 5
/** /events listesi ile aynı varsayılan sıralama */
export const QUICK_SEARCH_SORT = 'date,asc'

function slugId(prefix: string, value: string): string {
  return `${prefix}-${value.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'item'}`
}

function isRealImage(url?: string): boolean {
  return Boolean(url) && url !== EVENT_IMAGE_PLACEHOLDER
}

/**
 * Ticketmaster /api/events yanıtındaki etkinlikleri dropdown satırına çevirir.
 * İlk `limit` eşleşmeyi alır (API zaten keyword ile filtrelenmiş gelir).
 */
export function mapEventsToQuickSearchResults(
  events: EventSummary[],
  limit = QUICK_SEARCH_LIMIT
): QuickSearchResult[] {
  return events.slice(0, limit).map((event) => {
    const place = [event.venue, event.city].filter(Boolean).join(' · ')
    return {
      id: slugId('event', event.id),
      name: event.name,
      subtitle: place ? `Etkinlik · ${place}` : 'Etkinlik',
      image: isRealImage(event.image) ? event.image : undefined,
      icon: 'i-lucide-calendar',
      href: `/events/${event.id}`
    }
  })
}

/** Dropdown ve /events sayfasının paylaştığı arama query’si */
export function toQuickSearchApiQuery(keyword: string, limit = QUICK_SEARCH_LIMIT) {
  return {
    keyword: keyword.trim(),
    sort: QUICK_SEARCH_SORT,
    size: limit,
    page: 1
  }
}

export function toQuickSearchEventsPath(keyword: string): string {
  const q = keyword.trim()
  return q ? `/events?keyword=${encodeURIComponent(q)}` : '/events'
}
