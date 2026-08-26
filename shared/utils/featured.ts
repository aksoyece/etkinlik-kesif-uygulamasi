import type { EventSummary } from '../types/event'

/** Ticketmaster status: satışta / ertelenmiş olanlar öne çıkmaya uygun */
const FEATURED_OK_STATUS = new Set(['onsale', 'rescheduled', 'postponed'])

export function eventImageKey(url?: string): string {
  if (!url) return ''
  const withoutQuery = url.split('?')[0] ?? url
  return withoutQuery
    .replace(/\/\d+x\d+\//g, '/')
    .replace(/_(TABLET_LANDSCAPE_LARGE_16_9|RETINA_LANDSCAPE_16_9|RETINA_PORTRAIT_16_9|RETINA_PORTRAIT_3_2|TABLET_LANDSCAPE_16_9|TABLET_LANDSCAPE_3_2|EVENT_DETAIL_PAGE_16_9|RECOMENDATION_16_9|SOURCE|CUSTOM)\.(?:jpe?g|png|webp)$/i, '')
}

export function isFeaturedEligible(event: EventSummary): boolean {
  if (!event.image) return false
  const status = (event.status || 'onsale').toLowerCase()
  if (status === 'cancelled' || status === 'offsale') return false
  return FEATURED_OK_STATUS.has(status) || !event.status
}

/**
 * Aynı görseli / id’yi tekrarlamadan öne çıkan seçer.
 * Önce uygun (satışta + görselli) etkinlikler, yetmezse kalan havuzdan tamamlanır.
 */
export function pickDistinctFeatured(pool: EventSummary[], limit = 3): EventSummary[] {
  const selected: EventSummary[] = []
  const seenIds = new Set<string>()
  const seenImages = new Set<string>()

  const tryAdd = (event: EventSummary, requireEligible: boolean) => {
    if (selected.length >= limit) return
    if (seenIds.has(event.id)) return
    if (requireEligible && !isFeaturedEligible(event)) return

    const key = eventImageKey(event.image)
    if (key && seenImages.has(key)) return

    seenIds.add(event.id)
    if (key) seenImages.add(key)
    selected.push(event)
  }

  for (const event of pool) tryAdd(event, true)
  for (const event of pool) tryAdd(event, false)

  return selected
}
