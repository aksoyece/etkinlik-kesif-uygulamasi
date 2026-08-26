/**
 * Ticketmaster market yapılandırması.
 * Aktif pazarı değiştirmek için yalnızca ACTIVE_MARKET_ID’yi güncelleyin.
 * İleride TR / US vb. marketler aynı tablodan seçilebilir.
 */
export type MarketId = 'GB' | 'TR'

export interface MarketCity {
  label: string
  value: string
}

export interface MarketConfig {
  id: MarketId
  countryCode: string
  label: string
  /** Sayı / tarih formatı için */
  locale: string
  cities: MarketCity[]
  popularCities: MarketCity[]
}

export const MARKETS: Record<MarketId, MarketConfig> = {
  GB: {
    id: 'GB',
    countryCode: 'GB',
    label: 'United Kingdom',
    locale: 'en-GB',
    cities: [
      { label: 'London', value: 'London' },
      { label: 'Manchester', value: 'Manchester' },
      { label: 'Birmingham', value: 'Birmingham' },
      { label: 'Glasgow', value: 'Glasgow' },
      { label: 'Liverpool', value: 'Liverpool' },
      { label: 'Edinburgh', value: 'Edinburgh' },
      { label: 'Leeds', value: 'Leeds' },
      { label: 'Bristol', value: 'Bristol' },
      { label: 'Cardiff', value: 'Cardiff' },
      { label: 'Newcastle', value: 'Newcastle' }
    ],
    popularCities: [
      { label: 'London', value: 'London' },
      { label: 'Manchester', value: 'Manchester' },
      { label: 'Birmingham', value: 'Birmingham' },
      { label: 'Glasgow', value: 'Glasgow' },
      { label: 'Liverpool', value: 'Liverpool' },
      { label: 'Edinburgh', value: 'Edinburgh' }
    ]
  },
  TR: {
    id: 'TR',
    countryCode: 'TR',
    label: 'Türkiye',
    locale: 'tr-TR',
    cities: [
      { label: 'İstanbul', value: 'Istanbul' },
      { label: 'Ankara', value: 'Ankara' },
      { label: 'İzmir', value: 'Izmir' },
      { label: 'Antalya', value: 'Antalya' },
      { label: 'Bursa', value: 'Bursa' },
      { label: 'Muğla', value: 'Mugla' },
      { label: 'Eskişehir', value: 'Eskisehir' },
      { label: 'Gaziantep', value: 'Gaziantep' },
      { label: 'Adana', value: 'Adana' },
      { label: 'Konya', value: 'Konya' }
    ],
    popularCities: [
      { label: 'İstanbul', value: 'Istanbul' },
      { label: 'Ankara', value: 'Ankara' },
      { label: 'İzmir', value: 'Izmir' },
      { label: 'Antalya', value: 'Antalya' },
      { label: 'Bursa', value: 'Bursa' },
      { label: 'Muğla', value: 'Mugla' }
    ]
  }
}

/** Şimdilik tek aktif market: Ticketmaster UK */
export const ACTIVE_MARKET_ID: MarketId = 'GB'

export const ACTIVE_MARKET = MARKETS[ACTIVE_MARKET_ID]

export function getActiveCountryCode(): string {
  return ACTIVE_MARKET.countryCode
}

export function getMarketById(id: MarketId): MarketConfig {
  return MARKETS[id]
}
