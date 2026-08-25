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

export const FAVORITES_STORAGE_KEY = 'etkinlik-favoriler'

export function toHttps(url?: string): string | undefined {
  if (!url) {
    return undefined
  }

  return url.replace(/^http:/, 'https:')
}

export function pickEventImage(images?: TicketmasterImage[]): string | undefined {
  if (!images?.length) {
    return undefined
  }

  const ranked = [...images].sort((a, b) => {
    const fallbackScore = Number(a.fallback) - Number(b.fallback)
    if (fallbackScore !== 0) {
      return fallbackScore
    }

    const ratioScore = Number(b.ratio === '16_9') - Number(a.ratio === '16_9')
    if (ratioScore !== 0) {
      return ratioScore
    }

    return (b.width ?? 0) - (a.width ?? 0)
  })

  return toHttps(ranked[0]?.url)
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

  const addressParts = [
    venue.address?.line1,
    venue.address?.line2,
    venue.city?.name,
    venue.state?.stateCode || venue.state?.name,
    venue.postalCode,
    venue.country?.name
  ].filter(Boolean)

  return {
    id: venue.id,
    name: venue.name,
    url: venue.url,
    address: addressParts.join(', '),
    city: venue.city?.name,
    state: venue.state?.name,
    country: venue.country?.name,
    postalCode: venue.postalCode,
    latitude: venue.location?.latitude,
    longitude: venue.location?.longitude,
    parkingDetail: venue.parkingDetail || venue.parkingDetail,
    generalRule: venue.generalInfo?.generalRule || venue.generalInfo?.generalRule,
    boxOffice: venue.boxOfficeInfo?.openHoursDetail
      || venue.boxOfficeInfo?.phoneNumberDetail
      || venue.boxOfficeInfo?.openHoursDetail
      || venue.boxOfficeInfo?.phoneNumberDetail
  }
}

export function mapAttraction(attraction: TicketmasterAttraction): AttractionSummary {
  const classification = getPrimaryClassification(attraction.classifications)

  return {
    id: attraction.id,
    name: attraction.name || 'Sanatçı',
    url: attraction.url,
    image: pickEventImage(attraction.images),
    genre: classification?.genre?.name || classification?.segment?.name
  }
}

export function mapTicketmasterEvent(event: TicketmasterEvent): EventSummary {
  const venue = event._embedded?.venues?.[0]
  const classification = getPrimaryClassification(event.classifications)

  return {
    id: event.id,
    name: event.name,
    url: event.url,
    image: pickEventImage(event.images),
    dateLabel: formatEventDate(event.dates),
    localDate: event.dates?.start?.localDate,
    localTime: event.dates?.start?.localTime,
    city: venue?.city?.name,
    country: venue?.country?.name,
    venue: venue?.name,
    venueId: venue?.id,
    category: classification?.segment?.name,
    genre: classification?.genre?.name
  }
}

export function mapTicketmasterEventDetail(event: TicketmasterEvent): EventDetail {
  const summary = mapTicketmasterEvent(event)
  const images = [...new Set(
    (event.images ?? [])
      .map(image => toHttps(image.url))
      .filter((url): url is string => Boolean(url))
  )]

  return {
    ...summary,
    info: event.info || event.description,
    pleaseNote: event.pleaseNote,
    ticketUrl: event.url,
    status: event.dates?.status?.code,
    seatmap: event.seatmap?.staticUrl,
    priceLabel: formatPriceRange(event.priceRanges),
    attractions: (event._embedded?.attractions ?? []).map(mapAttraction),
    venueDetail: mapVenue(event._embedded?.venues?.[0]),
    images
  }
}

export function toFavoriteEvent(event: EventSummary): FavoriteEvent {
  return {
    id: event.id,
    name: event.name,
    image: event.image,
    dateLabel: event.dateLabel,
    city: event.city,
    venue: event.venue,
    category: event.category
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
