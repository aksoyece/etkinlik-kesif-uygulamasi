import type { EventSummary } from '../types/event'
import { isVagueCategory } from './labels'

export interface SimilarEventsOptions {
  excludeId: string
  /** Görüntülenen etkinliğin adı — aynı gösterinin diğer seanslarını da eler */
  excludeName?: string
  preferCity?: string
  limit?: number
}

const MONTH_TOKEN
  = '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|oca(?:k)?|şub(?:at)?|sub(?:at)?|mar(?:t)?|nis(?:an)?|may(?:ıs)?|haz(?:iran)?|tem(?:muz)?|a[gğ]u(?:stos)?|eyl(?:[uü]l)?|eki(?:m)?|kas(?:[iı]m)?|ara(?:l[iı]k)?)'

/** Başlıktaki seans / tarih eklerini temizleyerek karşılaştırma anahtarı üretir */
export function normalizeEventTitle(name: string): string {
  let value = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[''`´]/g, '')

  // "Show – 29 August", "Show | 30 Aug 2026", "Show - 2 Eylül"
  value = value.replace(
    new RegExp(`\\s*[-–—|:·]\\s*\\d{1,2}\\s*${MONTH_TOKEN}\\b.*$`, 'i'),
    ''
  )
  // "Show (29 Aug)" / "Show [30 August]"
  value = value.replace(
    new RegExp(`\\s*[(\\[]\\s*\\d{1,2}\\s*${MONTH_TOKEN}[^)\\]]*[)\\]]\\s*$`, 'i'),
    ''
  )
  // "Show - 29/08/2026", "Show - 2026-08-29"
  value = value.replace(/\s*[-–—|:·]\s*\d{1,4}[./-]\d{1,2}([./-]\d{1,4})?\b.*$/i, '')
  // Sondaki saat: "Show 19:30" / "Show 7.30pm"
  value = value.replace(/\s+\d{1,2}[:.]\d{2}\s*(?:am|pm)?\s*$/i, '')

  return value.replace(/[^a-z0-9ğüşıöç\s]+/gi, ' ').replace(/\s+/g, ' ').trim()
}

function eventDateSortKey(event: EventSummary): string {
  const date = event.localDate?.trim() || '9999-12-31'
  const time = (event.localTime?.trim() || '23:59:59').slice(0, 8)
  return `${date}T${time}`
}

/**
 * Aynı normalize başlıktan yalnızca en yakın (en erken) tarihli seansı bırakır.
 * Sıra korunur: ilk görülen başlık grubu, kazananın orijinal sırasına göre yer alır.
 */
export function dedupeEventsByTitleKeepingClosest(pool: EventSummary[]): EventSummary[] {
  const bestByTitle = new Map<string, EventSummary>()
  const order: string[] = []

  for (const event of pool) {
    const key = normalizeEventTitle(event.name || '')
    if (!key) continue

    const existing = bestByTitle.get(key)
    if (!existing) {
      bestByTitle.set(key, event)
      order.push(key)
      continue
    }

    if (eventDateSortKey(event) < eventDateSortKey(existing)) {
      bestByTitle.set(key, event)
    }
  }

  return order.map(key => bestByTitle.get(key)!).filter(Boolean)
}

/**
 * Aynı kategoriden gelen havuzdan benzer etkinlik seçer.
 * Önce aynı şehir, sonra diğerleri; mevcut etkinlik ve aynı gösterinin diğer seansları hariç.
 * En fazla `limit` farklı gösteri (aynı ismin farklı tarihleri doldurulmaz).
 */
export function pickSimilarEvents(
  pool: EventSummary[],
  options: SimilarEventsOptions
): EventSummary[] {
  const limit = options.limit ?? 4
  const preferCity = options.preferCity?.trim().toLowerCase()
  const excludeId = options.excludeId
  const excludeTitle = options.excludeName
    ? normalizeEventTitle(options.excludeName)
    : ''

  const usable = pool.filter((event) => {
    if (!event.id || event.id === excludeId) return false
    if (excludeTitle && normalizeEventTitle(event.name || '') === excludeTitle) return false
    const status = (event.status || 'onsale').toLowerCase()
    return status !== 'cancelled' && status !== 'offsale'
  })

  const unique = dedupeEventsByTitleKeepingClosest(usable)

  const preferred: EventSummary[] = []
  const rest: EventSummary[] = []

  for (const event of unique) {
    if (preferCity && event.city?.trim().toLowerCase() === preferCity) {
      preferred.push(event)
    } else {
      rest.push(event)
    }
  }

  return [...preferred, ...rest].slice(0, limit)
}

/** Benzer etkinlik API sorgusu — vague segment’te Family/genre’ye düşer */
export function toSimilarEventsQuery(event: {
  category?: string
  genre?: string
}): { classificationName?: string, keyword?: string } | null {
  if (event.category && !isVagueCategory(event.category)) {
    return { classificationName: event.category }
  }

  const genre = event.genre?.trim()
  if (!genre || genre.toUpperCase() === 'UNDEFINED') {
    return null
  }

  if (/^family$/i.test(genre) || /family/i.test(genre)) {
    return { classificationName: 'Family' }
  }

  return { keyword: genre }
}
