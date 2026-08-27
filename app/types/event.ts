export interface TicketmasterImage {
  url: string
  ratio?: string
  width?: number
  height?: number
  fallback?: boolean
}

export interface TicketmasterCity {
  name?: string
}

export interface TicketmasterCountry {
  name?: string
  countryCode?: string
}

export interface TicketmasterState {
  name?: string
  stateCode?: string
}

export interface TicketmasterAddress {
  line1?: string
  line2?: string
}

export interface TicketmasterLocation {
  longitude?: string
  latitude?: string
}

export interface TicketmasterNamedEntity {
  id?: string
  name?: string
  url?: string
  images?: TicketmasterImage[]
  classifications?: TicketmasterClassification[]
}

export interface TicketmasterVenue extends TicketmasterNamedEntity {
  postalCode?: string
  timezone?: string
  city?: TicketmasterCity
  state?: TicketmasterState
  country?: TicketmasterCountry
  address?: TicketmasterAddress
  location?: TicketmasterLocation
  parkingDetail?: string
  /** Erişilebilirlik / ADA metni */
  accessibleSeatingDetail?: string
  generalInfo?: {
    generalRule?: string
    childRule?: string
  }
  boxOfficeInfo?: {
    phoneNumberDetail?: string
    openHoursDetail?: string
    acceptedPaymentDetail?: string
    willCallDetail?: string
  }
}

export type TicketmasterAttraction = TicketmasterNamedEntity

export interface TicketmasterClassification {
  primary?: boolean
  segment?: TicketmasterNamedEntity
  genre?: TicketmasterNamedEntity
  subGenre?: TicketmasterNamedEntity
  family?: boolean
}

export interface TicketmasterDateInfo {
  localDate?: string
  localTime?: string
  dateTime?: string
  dateTBD?: boolean
  dateTBA?: boolean
  timeTBA?: boolean
  noSpecificTime?: boolean
}

export interface TicketmasterDates {
  start?: TicketmasterDateInfo
  timezone?: string
  status?: { code?: string }
  spanMultipleDays?: boolean
}

export interface TicketmasterPriceRange {
  type?: string
  currency?: string
  min?: number
  max?: number
}

export interface TicketmasterEvent {
  id: string
  name: string
  type?: string
  url?: string
  info?: string
  pleaseNote?: string
  description?: string
  images?: TicketmasterImage[]
  dates?: TicketmasterDates
  classifications?: TicketmasterClassification[]
  priceRanges?: TicketmasterPriceRange[]
  seatmap?: { staticUrl?: string }
  _embedded?: {
    venues?: TicketmasterVenue[]
    attractions?: TicketmasterAttraction[]
  }
}

export interface TicketmasterPage {
  size: number
  totalElements: number
  totalPages: number
  number: number
}

export interface TicketmasterEventSearchResponse {
  _embedded?: {
    events?: TicketmasterEvent[]
  }
  page?: TicketmasterPage
}

export interface TicketmasterClassificationItem {
  segment?: TicketmasterNamedEntity & {
    _embedded?: {
      genres?: TicketmasterNamedEntity[]
    }
  }
}

export interface TicketmasterClassificationSearchResponse {
  _embedded?: {
    classifications?: TicketmasterClassificationItem[]
  }
}

export interface EventSummary {
  id: string
  name: string
  url?: string
  image?: string
  dateLabel: string
  localDate?: string
  localTime?: string
  city?: string
  country?: string
  venue?: string
  venueId?: string
  /** Liste gömülü mekan — detay önizlemesi için adres/harita/link */
  venueDetail?: VenueSummary
  category?: string
  genre?: string
  priceLabel?: string
  /** Ticketmaster dates.status.code (onsale, offsale, cancelled, …) */
  status?: string
  /** Liste yanıtındaki attractions (popüler sanatçılar vb.) */
  attractions?: AttractionSummary[]
}

export interface AttractionSummary {
  id?: string
  name: string
  url?: string
  image?: string
  genre?: string
}

/** Anasayfa “Popüler Sanatçılar” kartı — event attractions’tan türetilir */
export interface PopularArtist {
  id: string
  name: string
  image?: string
  /** Tür veya kategori etiketi (ör. Rock, Spor) */
  label: string
  eventCount: number
  soonestDate?: string
}

export interface VenueSummary {
  id?: string
  name: string
  url?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  latitude?: string
  longitude?: string
  /** Otopark / ulaşım açıklaması (prose — çevrilir) */
  parkingDetail?: string
  /** Genel giriş / mekan kuralları (prose) */
  generalRule?: string
  /** Yaş / çocuk kuralları (prose) */
  childRule?: string
  /** Erişilebilirlik açıklaması (prose) */
  accessibilityDetail?: string
  /** Gişe / ödeme / will-call metinleri (prose; telefon ayrı) */
  boxOffice?: string
  /** Ham telefon — çevrilmez */
  boxOfficePhone?: string
}

export interface EventDetail extends EventSummary {
  info?: string
  pleaseNote?: string
  ticketUrl?: string
  status?: string
  seatmap?: string
  priceLabel?: string
  attractions: AttractionSummary[]
  venueDetail?: VenueSummary
  images: string[]
}

export interface FavoriteEvent {
  id: string
  name: string
  image?: string
  dateLabel: string
  localDate?: string
  localTime?: string
  city?: string
  country?: string
  venue?: string
  venueId?: string
  venueDetail?: VenueSummary
  url?: string
  category?: string
  priceLabel?: string
}

export interface EventListResult {
  events: EventSummary[]
  page: number
  size: number
  total: number
  totalPages: number
}

export interface EventSearchParams {
  keyword?: string
  city?: string
  classificationName?: string
  startDate?: string
  endDate?: string
  sort?: string
  page?: number
  size?: number
}

export interface EventFilterState {
  keyword: string
  city: string
  classificationName: string
  startDate: string
  endDate: string
  sort: string
}

export interface ClassificationOption {
  id: string
  name: string
}
