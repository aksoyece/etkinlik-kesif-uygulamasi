import {
  applyKnownPhrases,
  applyLocaleFixes,
  localizeAddressLine,
  localizeCountryName,
  looksMostlyEnglish
} from '#shared/utils/localize'

/** Aynı Ticketmaster metni tekrar çevrilmesin */
const translationCache = new Map<string, string>()

const TRANSLATE_TIMEOUT_MS = 4500

function cacheKey(text: string) {
  return `tr:v2:${text}`
}

function safeFallback(text: string): string {
  // Karışık dil yok — yalnızca yerel kalıp + gün/saat düzeltmesi
  return applyLocaleFixes(applyKnownPhrases(text))
}

function chunkText(text: string, max = 450): string[] {
  if (text.length <= max) {
    return [text]
  }

  const chunks: string[] = []
  let remaining = text
  while (remaining.length > max) {
    let splitAt = remaining.lastIndexOf('. ', max)
    if (splitAt < max * 0.4) {
      splitAt = remaining.lastIndexOf(' ', max)
    }
    if (splitAt < max * 0.3) {
      splitAt = max
    }
    chunks.push(remaining.slice(0, splitAt + 1).trim())
    remaining = remaining.slice(splitAt + 1).trim()
  }
  if (remaining) {
    chunks.push(remaining)
  }
  return chunks
}

function splitForTranslation(text: string): string[] {
  const bulletParts = text
    .split(/(?=\*\s)|(?<=\.)\s+(?=[A-Z])/)
    .map(part => part.trim())
    .filter(Boolean)

  if (bulletParts.length > 1) {
    return bulletParts.flatMap(part => chunkText(part, 450))
  }

  return chunkText(text, 450)
}

/**
 * Tek parça çeviri. Başarısızsa null — kısmi TR+EN birleştirilmez.
 */
async function translateChunkRaw(text: string): Promise<string | null> {
  try {
    const raw = await $fetch<unknown>('https://translate.googleapis.com/translate_a/single', {
      query: {
        client: 'gtx',
        sl: 'en',
        tl: 'tr',
        dt: 't',
        q: text
      },
      timeout: 8000
    })

    if (Array.isArray(raw) && Array.isArray(raw[0])) {
      const translated = raw[0]
        .map((row: unknown) => (Array.isArray(row) ? String(row[0] ?? '') : ''))
        .join('')
        .trim()

      if (translated && translated !== text) {
        return translated
      }
    }
  } catch {
    // MyMemory
  }

  try {
    const result = await $fetch<{
      responseData?: { translatedText?: string }
      responseStatus?: number
    }>('https://api.mymemory.translated.net/get', {
      query: {
        q: text,
        langpair: 'en|tr'
      },
      timeout: 8000
    })

    const translated = result.responseData?.translatedText?.trim()
    if (
      translated
      && result.responseStatus === 200
      && !/MYMEMORY WARNING/i.test(translated)
      && translated !== text
    ) {
      return translated
    }
  } catch {
    // fail
  }

  return null
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms)
      })
    ])
  } finally {
    if (timer) {
      clearTimeout(timer)
    }
  }
}

/**
 * Kullanıcıya görünen prose metinleri Türkçeye çevirir.
 * Proper noun / URL / teknik değerler için kullanılmaz.
 * Başarısızlıkta: tamamen güvenli fallback (karışık dil yok).
 */
export async function translateToTurkish(
  text?: string | null,
  _options: { force?: boolean } = {}
): Promise<string | undefined> {
  if (text == null) {
    return undefined
  }

  const trimmed = text.trim()
  if (!trimmed) {
    return text
  }

  // Zaten Türkçe / kısa teknik
  if (!looksMostlyEnglish(trimmed)) {
    return applyLocaleFixes(trimmed)
  }

  const key = cacheKey(trimmed)
  const cached = translationCache.get(key)
  if (cached) {
    return cached
  }

  const run = async (): Promise<string> => {
    const parts = splitForTranslation(trimmed)
    const translatedParts = await Promise.all(parts.map(part => translateChunkRaw(part)))

    // Herhangi bir parça çevrilemediyse tüm metin için güvenli fallback
    if (translatedParts.some(part => part == null)) {
      return safeFallback(trimmed)
    }

    const joined = translatedParts
      .map(part => part as string)
      .join(' ')
      .replace(/[ \t]{2,}/g, ' ')
      .trim()

    const fixed = applyLocaleFixes(joined)

    // Makine çıktısı hâlâ ağır İngilizceyse karışık kabul etme
    if (looksMostlyEnglish(fixed) && fixed.length > 48) {
      return safeFallback(trimmed)
    }

    return fixed
  }

  const result = await withTimeout(run(), TRANSLATE_TIMEOUT_MS)
  const finalText = result ?? safeFallback(trimmed)
  translationCache.set(key, finalText)
  return finalText
}

export async function localizeVenueCopy<T extends {
  address?: string
  country?: string
  parkingDetail?: string
  generalRule?: string
  childRule?: string
  accessibilityDetail?: string
  boxOffice?: string
  boxOfficePhone?: string
}>(venue: T): Promise<T> {
  const [
    parkingDetail,
    generalRule,
    childRule,
    accessibilityDetail,
    boxOffice
  ] = await Promise.all([
    translateToTurkish(venue.parkingDetail),
    translateToTurkish(venue.generalRule),
    translateToTurkish(venue.childRule),
    translateToTurkish(venue.accessibilityDetail),
    translateToTurkish(venue.boxOffice)
  ])

  return {
    ...venue,
    // Sokak adresi çevrilmez — yalnızca ülke etiketi
    address: localizeAddressLine(venue.address) || venue.address,
    country: localizeCountryName(venue.country) || venue.country,
    parkingDetail,
    generalRule,
    childRule,
    accessibilityDetail,
    boxOffice,
    // Telefon olduğu gibi
    boxOfficePhone: venue.boxOfficePhone
  }
}

export async function localizeEventCopy<T extends {
  info?: string
  pleaseNote?: string
  country?: string
  name?: string
  venue?: string
  venueDetail?: {
    name?: string
    address?: string
    country?: string
    parkingDetail?: string
    generalRule?: string
    childRule?: string
    accessibilityDetail?: string
    boxOffice?: string
    boxOfficePhone?: string
  }
  attractions?: Array<{ name: string, url?: string }>
}>(detail: T): Promise<T> {
  const [info, pleaseNote, venueDetail] = await Promise.all([
    translateToTurkish(detail.info),
    translateToTurkish(detail.pleaseNote),
    detail.venueDetail
      ? localizeVenueCopy(detail.venueDetail)
      : Promise.resolve(detail.venueDetail)
  ])

  return {
    ...detail,
    // name / venue / attraction adları / URL’ler dokunulmaz
    info,
    pleaseNote,
    country: localizeCountryName(detail.country) || detail.country,
    venueDetail
  }
}
