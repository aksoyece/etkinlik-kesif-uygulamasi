import {
  applyKnownPhrases,
  applyLocaleFixes,
  localizeAddressLine,
  localizeCountryName,
  looksMostlyEnglish
} from '#shared/utils/localize'

/** Yalnızca başarılı Türkçe çeviriler — İngilizce fallback kalıcı cache’lenmez */
const translationCache = new Map<string, string>()

const TRANSLATE_TIMEOUT_MS = 2800

function cacheKey(text: string) {
  return `tr:v3:${text}`
}

function safeFallback(text: string): string {
  return applyLocaleFixes(applyKnownPhrases(text))
}

function hasTurkishSignal(text: string): boolean {
  if (/[ğüşıöçĞÜŞİÖÇ]/.test(text)) {
    return true
  }
  return /\b(ve|bir|için|ile|bu|olan|olarak|müze|etkinlik|bilet|lütfen|giriş|otopark|saat|gün|yasaktır|açılır|kişi|hane|deneyim|keşfedin|dünya|arkadaş|gerçeklik)\b/i.test(text)
}

function isAcceptableTranslation(original: string, translated: string): boolean {
  if (!translated || translated === original) {
    return false
  }
  if (translated.trim().toLowerCase() === original.trim().toLowerCase()) {
    return false
  }
  // Proper noun’lu iyi çeviriler looksMostlyEnglish’e takılmasın
  if (hasTurkishSignal(translated)) {
    return true
  }
  // Kısa teknik satırlar
  if (translated.length < 40 && translated !== original) {
    return true
  }
  return false
}

function chunkText(text: string, max = 900): string[] {
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

async function translateViaGoogle(text: string): Promise<string | null> {
  try {
    const raw = await $fetch<unknown>('https://translate.googleapis.com/translate_a/single', {
      query: {
        client: 'gtx',
        sl: 'en',
        tl: 'tr',
        dt: 't',
        q: text
      },
      timeout: 10000
    })

    if (Array.isArray(raw) && Array.isArray(raw[0])) {
      const translated = raw[0]
        .map((row: unknown) => (Array.isArray(row) ? String(row[0] ?? '') : ''))
        .join('')
        .trim()
      if (isAcceptableTranslation(text, translated)) {
        return translated
      }
    }
  } catch {
    // next provider
  }
  return null
}

async function translateViaMyMemory(text: string): Promise<string | null> {
  try {
    const result = await $fetch<{
      responseData?: { translatedText?: string }
      responseStatus?: number
    }>('https://api.mymemory.translated.net/get', {
      query: {
        q: text,
        langpair: 'en|tr'
      },
      timeout: 10000
    })

    const translated = result.responseData?.translatedText?.trim()
    if (
      translated
      && result.responseStatus === 200
      && !/MYMEMORY WARNING/i.test(translated)
      && isAcceptableTranslation(text, translated)
    ) {
      return translated
    }
  } catch {
    // next
  }
  return null
}

async function translateViaLibre(text: string): Promise<string | null> {
  const endpoints = [
    'https://libretranslate.com/translate',
    'https://translate.argosopentech.com/translate'
  ]

  for (const endpoint of endpoints) {
    try {
      const result = await $fetch<{ translatedText?: string }>(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          q: text,
          source: 'en',
          target: 'tr',
          format: 'text',
          api_key: ''
        },
        timeout: 12000
      })
      const translated = result.translatedText?.trim()
      if (translated && isAcceptableTranslation(text, translated)) {
        return translated
      }
    } catch {
      // try next endpoint
    }
  }
  return null
}

/** Sağlayıcıları sırayla dene — Libre yavaş/kararsız, kritik yolda yok */
async function translateChunkRaw(text: string): Promise<string | null> {
  return (
    await translateViaGoogle(text)
    ?? await translateViaMyMemory(text)
  )
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
 * Başarılı sonuçlar cache’lenir; İngilizce fallback cache’lenmez (sonra tekrar dener).
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

  if (!looksMostlyEnglish(trimmed)) {
    return applyLocaleFixes(trimmed)
  }

  const key = cacheKey(trimmed)
  const cached = translationCache.get(key)
  if (cached) {
    return cached
  }

  const run = async (): Promise<string | null> => {
    const parts = chunkText(trimmed, 400)
    const translatedParts: string[] = []

    // Sıralı — rate limit’e takılmamak için
    for (const part of parts) {
      const translated = await translateChunkRaw(part)
      if (!translated) {
        return null
      }
      translatedParts.push(translated)
    }

    const joined = translatedParts.join(' ').replace(/[ \t]{2,}/g, ' ').trim()
    const fixed = applyLocaleFixes(joined)

    if (!isAcceptableTranslation(trimmed, fixed)) {
      return null
    }

    return fixed
  }

  const result = await withTimeout(run(), TRANSLATE_TIMEOUT_MS)

  if (result) {
    translationCache.set(key, result)
    return result
  }

  // Cache’leme — bir sonraki istekte tekrar dene
  return safeFallback(trimmed)
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
  name?: string
}>(venue: T): Promise<T> {
  // İsim / adres / ülke hemen — makine çevirisi yok
  const base = {
    ...venue,
    address: localizeAddressLine(venue.address) || venue.address,
    country: localizeCountryName(venue.country) || venue.country,
    boxOfficePhone: venue.boxOfficePhone
  }

  const hasProse = Boolean(
    venue.parkingDetail
    || venue.generalRule
    || venue.childRule
    || venue.accessibilityDetail
    || venue.boxOffice
  )

  if (!hasProse) {
    return base
  }

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
    ...base,
    parkingDetail,
    generalRule,
    childRule,
    accessibilityDetail,
    boxOffice
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
  // Paralel: mekan adı/adres çeviriye bağlı değil; prose alanları birlikte biter
  const [info, pleaseNote, venueDetail] = await Promise.all([
    translateToTurkish(detail.info),
    translateToTurkish(detail.pleaseNote),
    detail.venueDetail
      ? localizeVenueCopy(detail.venueDetail)
      : Promise.resolve(detail.venueDetail)
  ])

  return {
    ...detail,
    info,
    pleaseNote,
    country: localizeCountryName(detail.country) || detail.country,
    venueDetail
  }
}
