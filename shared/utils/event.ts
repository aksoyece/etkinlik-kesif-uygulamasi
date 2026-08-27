import type {
  AttractionSummary,
  EventDetail,
  EventSummary,
  FavoriteEvent,
  TicketmasterAttraction,
  TicketmasterClassification,
  TicketmasterDates,
  TicketmasterEvent,
  TicketmasterImage,
  TicketmasterPriceRange,
  TicketmasterVenue,
  VenueSummary
} from '../types/event'
import { localizeAddressLine, localizeCountryName } from './localize'
import { resolveTicketUrl } from './ticketUrl'

export const FAVORITES_STORAGE_KEY = 'etkinlik-favoriler'
export const LAST_CITY_STORAGE_KEY = 'etkinlik-son-sehir'

export function readLastCity(): string | null {
  if (!import.meta.client) {
    return null
  }
  try {
    return localStorage.getItem(LAST_CITY_STORAGE_KEY)
  } catch {
    return null
  }
}

export function writeLastCity(city: string) {
  if (!import.meta.client || !city) {
    return
  }
  try {
    localStorage.setItem(LAST_CITY_STORAGE_KEY, city)
  } catch {
    // ignore
  }
}

const TICKETMASTER_IMAGE_SIZES = [
  'TABLET_LANDSCAPE_LARGE_16_9',
  'RETINA_LANDSCAPE_16_9',
  'RETINA_PORTRAIT_16_9',
  'RETINA_PORTRAIT_3_2',
  'TABLET_LANDSCAPE_16_9',
  'TABLET_LANDSCAPE_3_2',
  'EVENT_DETAIL_PAGE_16_9',
  'RECOMENDATION_16_9',
  'RECOMMENDATION_16_9',
  'ARTIST_PAGE_3_2',
  'SOURCE',
  'CUSTOM',
  'BLOCK'
]

/** Kart için kabul edilen minimum genişlik — altındakiler büyütülmez */
export const MIN_EVENT_IMAGE_WIDTH = 640
/** Tercih edilen kart genişliği */
export const PREFERRED_EVENT_IMAGE_WIDTH = 1024

export const EVENT_IMAGE_PLACEHOLDER = '/placeholder-event.svg'

export function toHttps(url?: string): string | undefined {
  if (!url) {
    return undefined
  }

  return url.replace(/^http:/, 'https:')
}

/**
 * Ticketmaster / Universe URL’lerini kart ve hero için optimize eder.
 * Universe scale_crop kare logoları bozduğu için kırpma kaldırılır.
 */
export function toOptimizedImageUrl(
  url?: string,
  options?: { forHero?: boolean, width?: number }
): string | undefined {
  const secure = toHttps(url)
  if (!secure) {
    return undefined
  }

  return toHighResTicketmasterUrl(secure, { width: options?.width })
}

/**
 * Yalnızca zaten yüksek çözünürlüklü Ticketmaster URL’lerini aynı ailede büyütür.
 * Düşük çözünürlüklü / farklı oranlı görselleri LARGE_16_9’a zorlamaz (bulanık kırpma üretir).
 */
export function toHighResTicketmasterUrl(url?: string, meta?: { width?: number }): string | undefined {
  const secure = toHttps(url)
  if (!secure) {
    return undefined
  }

  // Universe: scale_crop kare logoları zorla sündürüp bozar → orijinal URL
  if (/images\.universe\.com/i.test(secure)) {
    return secure.replace(/\/?-\/scale_crop\/[^/]+\/[^/]+/i, '')
  }

  if (!/ticketm\.net/i.test(secure)) {
    return secure
  }

  if (/_(SOURCE)(?:\.(?:jpe?g|png|webp))?$/i.test(secure)) {
    return secure
  }

  // Küçük görselleri upscale etme
  if ((meta?.width ?? PREFERRED_EVENT_IMAGE_WIDTH) < PREFERRED_EVENT_IMAGE_WIDTH) {
    return secure
  }

  // Yalnızca 16:9 ailesini LARGE’a yükselt
  if (!/16_9|LANDSCAPE_LARGE/i.test(secure)) {
    return secure
  }

  const pattern = new RegExp(`(_|/)(${TICKETMASTER_IMAGE_SIZES.join('|')})(\\.(?:jpe?g|png|webp))$`, 'i')
  return secure.replace(pattern, '$1TABLET_LANDSCAPE_LARGE_16_9$3')
}

/** Hâlâ düşük kırpma / SOURCE — kartta blur+contain gerekir */
export function isSoftCoverImage(url?: string | null): boolean {
  if (!url || url === EVENT_IMAGE_PLACEHOLDER) {
    return true
  }
  if (isSourceTicketmasterImage(url)) {
    return true
  }
  const crop = url.match(/scale_crop\/(\d+)x(\d+)/i)
  if (crop && Number(crop[1]) < 1600) {
    return true
  }
  return false
}

function isLandscapeCover(image: TicketmasterImage): boolean {
  const url = image.url || ''
  if (image.ratio === '16_9' || url.includes('16_9') || /LANDSCAPE/i.test(url)) {
    return true
  }
  const w = image.width ?? 0
  const h = image.height ?? 0
  return w > 0 && h > 0 && w / h >= 1.4
}

function imageArea(image: TicketmasterImage): number {
  const w = image.width ?? 0
  const h = image.height ?? 0
  if (w && h) {
    return w * h
  }
  return w * w
}

/** Kart kapağında birincil seçimde SOURCE/BLOCK kullanma — object-cover ile aşırı zoom üretir */
function isBadCardSource(url?: string): boolean {
  if (!url) {
    return true
  }
  return /_(SOURCE|BLOCK)(?:\.(?:jpe?g|png|webp))?$/i.test(url)
}

export function isSourceTicketmasterImage(url?: string | null): boolean {
  if (!url) {
    return false
  }
  // Universe scale_crop kare logoları — kartta SOURCE gibi blur+contain
  if (/images\.universe\.com/i.test(url)) {
    return true
  }
  return /_SOURCE(?:\.(?:jpe?g|png|webp))?$/i.test(url)
}

/**
 * images[0] kullanılmaz.
 * 16:9 / landscape tercih → genişlik×yükseklik sırala → ≥1024 tercih → yoksa ≥640 → yoksa undefined.
 * SOURCE/BLOCK birincil havuzda yok; düşük çözünürlük büyütülmez.
 */
export function pickBestCoverFromImages(
  images?: TicketmasterImage[],
  minWidth = MIN_EVENT_IMAGE_WIDTH
): string | undefined {
  if (!images?.length) {
    return undefined
  }

  const withUrl = images.filter(image => Boolean(image.url) && !image.fallback && !isBadCardSource(image.url))
  const pool = withUrl.length
    ? withUrl
    : images.filter(image => Boolean(image.url) && !isBadCardSource(image.url))

  if (!pool.length) {
    return undefined
  }

  const wideEnough = pool.filter(image => (image.width ?? 0) >= minWidth)
  // width metadata yoksa URL’de 16_9 / LANDSCAPE olanları kabul et
  const usable = wideEnough.length
    ? wideEnough
    : pool.filter(image =>
        (image.width ?? 0) === 0
        && isLandscapeCover(image)
        && /16_9|LANDSCAPE|RETINA|TABLET/i.test(image.url || '')
      )

  if (!usable.length) {
    return undefined
  }

  const preferred = usable.filter(image => (image.width ?? 0) >= PREFERRED_EVENT_IMAGE_WIDTH)
  const candidates = preferred.length ? preferred : usable

  const landscape = candidates.filter(isLandscapeCover)
  const ranked = [...(landscape.length ? landscape : candidates)].sort(
    (a, b) => imageArea(b) - imageArea(a) || (b.width ?? 0) - (a.width ?? 0)
  )

  const best = ranked[0]
  if (!best?.url) {
    return undefined
  }

  return toOptimizedImageUrl(best.url, { width: best.width || PREFERRED_EVENT_IMAGE_WIDTH }) || toHttps(best.url)
}

/**
 * Ticketmaster görsellerinden kart/detay için en net adresi seçer.
 */
export function getBestEventImage(images?: TicketmasterImage[]): string {
  return pickBestCoverFromImages(images) || EVENT_IMAGE_PLACEHOLDER
}

/**
 * 16:9 event afişi → attraction 16:9 → (son çare) SOURCE olduğu gibi → placeholder.
 * SOURCE→TABLET promote edilmez: Merlin CDN çoğu LARGE varyantında 403 döner.
 */
export function resolveEventCoverImage(event: {
  images?: TicketmasterImage[]
  _embedded?: { attractions?: TicketmasterAttraction[] }
}): string {
  const fromEvent = pickBestCoverFromImages(event.images)
  if (fromEvent) {
    return fromEvent
  }

  for (const attraction of event._embedded?.attractions ?? []) {
    const fromAttraction = pickBestCoverFromImages(attraction.images)
    if (fromAttraction) {
      return fromAttraction
    }
  }

  const sourceOnly = (event.images ?? [])
    .filter(image => image.url && !image.fallback && isSourceTicketmasterImage(image.url))
    .sort((a, b) => imageArea(b) - imageArea(a))[0]

  if (sourceOnly?.url) {
    return toHttps(sourceOnly.url) || EVENT_IMAGE_PLACEHOLDER
  }

  return EVENT_IMAGE_PLACEHOLDER
}

/** @deprecated getBestEventImage kullanın */
export function pickEventImage(images?: TicketmasterImage[]): string {
  return getBestEventImage(images)
}

/**
 * Attraction görselleri: SOURCE/ARTIST_PAGE tercih et (logo/avatar).
 * Kart kapağı için resolveEventCoverImage / pickBestCoverFromImages kullanın.
 */
export function getBestAttractionImage(images?: TicketmasterImage[]): string | undefined {
  if (!images?.length) {
    return undefined
  }

  const usable = images.filter(image => Boolean(image.url))
  if (!usable.length) {
    return undefined
  }

  const nonFallback = usable.filter(image => !image.fallback)
  const pool = nonFallback.length ? nonFallback : usable

  const source = pool.find(image => /_SOURCE(?:\.(?:jpe?g|png|webp))?$/i.test(image.url || ''))
  if (source?.url) {
    return toHttps(source.url)
  }

  const artistPage = pool.find(image => /ARTIST_PAGE/i.test(image.url || ''))
  if (artistPage?.url) {
    return toHttps(artistPage.url)
  }

  return pickBestCoverFromImages(images)
}

export function formatEventDate(dates?: TicketmasterDates): string {
  const start = dates?.start
  if (!start?.localDate || start.dateTBA || start.dateTBD) {
    return 'Tarih açıklanacak'
  }

  const localTime = start.localTime
  const date = new Date(`${start.localDate}T${localTime || '00:00:00'}`)
  if (Number.isNaN(date.getTime())) {
    return start.localDate
  }

  const formattedDate = new Intl.DateTimeFormat('tr-TR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)

  if (!localTime || start.timeTBA || start.noSpecificTime) {
    return formattedDate
  }

  const formattedTime = new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)

  return `${formattedDate} • ${formattedTime}`
}

export function getPrimaryClassification(
  classifications?: TicketmasterClassification[]
): TicketmasterClassification | undefined {
  return classifications?.find(item => item.primary) ?? classifications?.[0]
}

export function formatPriceRange(ranges?: TicketmasterPriceRange[]): string | undefined {
  const range = ranges?.[0]
  if (!range || (range.min == null && range.max == null)) {
    return undefined
  }

  const currency = range.currency || 'USD'
  const formatter = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  })

  if (range.min != null && range.max != null && range.min !== range.max) {
    return `${formatter.format(range.min)} - ${formatter.format(range.max)}`
  }

  return formatter.format(range.min ?? range.max ?? 0)
}

export function mapVenue(venue?: TicketmasterVenue): VenueSummary | undefined {
  if (!venue?.name) {
    return undefined
  }

  const country = localizeCountryName(venue.country?.name) || venue.country?.name

  const addressParts = [
    venue.address?.line1,
    venue.address?.line2,
    venue.city?.name,
    venue.state?.stateCode || venue.state?.name,
    venue.postalCode,
    country
  ].filter(Boolean)

  return {
    id: venue.id,
    name: venue.name,
    url: venue.url,
    address: localizeAddressLine(addressParts.join(', ')),
    city: venue.city?.name,
    state: venue.state?.name,
    country,
    postalCode: venue.postalCode,
    latitude: venue.location?.latitude,
    longitude: venue.location?.longitude,
    parkingDetail: venue.parkingDetail,
    generalRule: venue.generalInfo?.generalRule,
    childRule: venue.generalInfo?.childRule,
    accessibilityDetail: venue.accessibleSeatingDetail,
    boxOffice: [
      venue.boxOfficeInfo?.openHoursDetail,
      venue.boxOfficeInfo?.acceptedPaymentDetail,
      venue.boxOfficeInfo?.willCallDetail
    ].filter(Boolean).join('\n\n') || undefined,
    boxOfficePhone: venue.boxOfficeInfo?.phoneNumberDetail
  }
}

export function mapAttraction(attraction: TicketmasterAttraction): AttractionSummary {
  const classification = getPrimaryClassification(attraction.classifications)

  return {
    id: attraction.id,
    name: attraction.name || 'Sanatçı',
    url: attraction.url,
    image: getBestAttractionImage(attraction.images),
    genre: classification?.genre?.name || classification?.segment?.name
  }
}

export function mapTicketmasterEvent(event: TicketmasterEvent): EventSummary {
  const venue = event._embedded?.venues?.[0]
  const classification = getPrimaryClassification(event.classifications)
  const eventImage = resolveEventCoverImage(event)
  const rawAttractions = event._embedded?.attractions ?? []

  const attractions = rawAttractions.map((attraction) => {
    const mapped = mapAttraction(attraction)
    const hasOwnImage = Boolean(mapped.image) && mapped.image !== EVENT_IMAGE_PLACEHOLDER
    if (hasOwnImage) {
      return mapped
    }
    // Tek isimde event afişi güvenli; maç afişi (2+ attraction) yanlış logoya yapışmasın
    if (rawAttractions.length === 1 && eventImage !== EVENT_IMAGE_PLACEHOLDER) {
      return { ...mapped, image: eventImage }
    }
    return { ...mapped, image: undefined }
  })

  return {
    id: event.id,
    name: event.name,
    url: resolveTicketUrl(event.url, { eventId: event.id }),
    image: eventImage,
    dateLabel: formatEventDate(event.dates),
    localDate: event.dates?.start?.localDate,
    localTime: event.dates?.start?.localTime,
    city: venue?.city?.name,
    country: localizeCountryName(venue?.country?.name) || venue?.country?.name,
    venue: venue?.name,
    venueId: venue?.id,
    category: classification?.segment?.name,
    genre: classification?.genre?.name,
    priceLabel: formatPriceRange(event.priceRanges),
    status: event.dates?.status?.code,
    attractions: attractions.length ? attractions : undefined
  }
}

export function mapTicketmasterEventDetail(event: TicketmasterEvent): EventDetail {
  const summary = mapTicketmasterEvent(event)
  const cover = summary.image !== EVENT_IMAGE_PLACEHOLDER ? summary.image : undefined

  const galleryFromApi = (event.images ?? [])
    .filter(image => Boolean(image.url) && !image.fallback && (image.width ?? 0) >= MIN_EVENT_IMAGE_WIDTH)
    .sort((a, b) => {
      const coverScore = Number(isLandscapeCover(b)) - Number(isLandscapeCover(a))
      if (coverScore !== 0) {
        return coverScore
      }
      return imageArea(b) - imageArea(a)
    })
    .map(image => toOptimizedImageUrl(image.url, {
      forHero: true,
      width: image.width
    }) || toHttps(image.url))
    .filter((url): url is string => Boolean(url))

  const images = uniqueGalleryImages([
    ...(cover
      ? [toOptimizedImageUrl(cover, { forHero: true }) || cover]
      : []),
    ...galleryFromApi
  ])

  return {
    ...summary,
    info: event.info || event.description,
    pleaseNote: event.pleaseNote,
    ticketUrl: resolveTicketUrl(event.url, { eventId: event.id }),
    status: event.dates?.status?.code,
    seatmap: event.seatmap?.staticUrl,
    priceLabel: formatPriceRange(event.priceRanges),
    attractions: (event._embedded?.attractions ?? []).map(mapAttraction),
    venueDetail: mapVenue(event._embedded?.venues?.[0]),
    images: images.length ? images : [EVENT_IMAGE_PLACEHOLDER]
  }
}

export function uniqueGalleryImages(urls: string[]): string[] {
  const seen = new Set<string>()
  const images: string[] = []

  for (const url of urls) {
    const key = url.replace(/_(TABLET_LANDSCAPE_LARGE_16_9|RETINA_LANDSCAPE_16_9|RETINA_PORTRAIT_16_9|RETINA_PORTRAIT_3_2|TABLET_LANDSCAPE_16_9|TABLET_LANDSCAPE_3_2|EVENT_DETAIL_PAGE_16_9|RECOMENDATION_16_9|SOURCE|CUSTOM)\.(?:jpe?g|png|webp)$/i, '')
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    images.push(url)
  }

  return images
}

export function toFavoriteEvent(event: EventSummary): FavoriteEvent {
  return {
    id: event.id,
    name: event.name,
    image: event.image,
    dateLabel: event.dateLabel,
    localDate: event.localDate,
    localTime: event.localTime,
    city: event.city,
    venue: event.venue,
    category: event.category,
    priceLabel: event.priceLabel
  }
}

export function isFavoriteEvent(items: FavoriteEvent[], id: string): boolean {
  return items.some(item => item.id === id)
}

export function toggleFavoriteEvent(items: FavoriteEvent[], event: FavoriteEvent): FavoriteEvent[] {
  return isFavoriteEvent(items, event.id)
    ? items.filter(item => item.id !== event.id)
    : [...items, event]
}

export function toTicketmasterDateTime(date?: string, endOfDay = false): string | undefined {
  if (!date) {
    return undefined
  }

  return endOfDay ? `${date}T23:59:59Z` : `${date}T00:00:00Z`
}

export function nowTicketmasterDateTime(): string {
  return `${new Date().toISOString().slice(0, 19)}Z`
}

export function mapsUrl(venue?: VenueSummary): string | undefined {
  if (!venue) {
    return undefined
  }

  if (venue.latitude && venue.longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`
  }

  if (venue.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}`
  }

  return undefined
}
