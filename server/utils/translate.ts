import {
  applyKnownPhrases,
  applyLocaleFixes,
  localizeAddressLine,
  localizeCountryName,
  looksMostlyEnglish
} from '#shared/utils/localize'

const translationCache = new Map<string, string>()

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

async function translateChunk(text: string): Promise<string> {
  const cached = translationCache.get(text)
  if (cached) {
    return cached
  }

  // Google Translate
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

      if (translated && translated !== text && !looksMostlyEnglish(translated)) {
        translationCache.set(text, translated)
        return translated
      }
      // Bazen Google İngilizce bırakır; yine de farklıysa kabul et ve post-fix uygula
      if (translated && translated !== text) {
        const fixed = applyLocaleFixes(translated)
        translationCache.set(text, fixed)
        return fixed
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
      timeout: 10000
    })

    const translated = result.responseData?.translatedText?.trim()
    if (
      translated
      && result.responseStatus === 200
      && !/MYMEMORY WARNING/i.test(translated)
      && translated !== text
    ) {
      const fixed = applyLocaleFixes(translated)
      translationCache.set(text, fixed)
      return fixed
    }
  } catch {
    // kalıp yedek
  }

  return applyLocaleFixes(applyKnownPhrases(text))
}

/**
 * İngilizce metni tam çevirir. Önce makine çevirisi, sonra gün/saat/ülke düzeltmesi.
 * Kelime kelime sözlük uygulanmaz.
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

  // Zaten Türkçe
  if (!looksMostlyEnglish(trimmed)) {
    return applyLocaleFixes(trimmed)
  }

  // Orijinal İngilizceyi parçala ve çevir (önceden bozmadan)
  const parts = splitForTranslation(trimmed)
  const translatedParts = await Promise.all(parts.map(part => translateChunk(part)))
  const joined = translatedParts.join(' ').replace(/[ \t]{2,}/g, ' ').trim()

  return applyLocaleFixes(joined)
}

export async function localizeVenueCopy<T extends {
  address?: string
  country?: string
  parkingDetail?: string
  generalRule?: string
  boxOffice?: string
}>(venue: T): Promise<T> {
  const [parkingDetail, generalRule, boxOffice, address] = await Promise.all([
    translateToTurkish(venue.parkingDetail, { force: true }),
    translateToTurkish(venue.generalRule, { force: true }),
    translateToTurkish(venue.boxOffice, { force: true }),
    Promise.resolve(localizeAddressLine(venue.address) || venue.address)
  ])

  return {
    ...venue,
    address,
    country: localizeCountryName(venue.country) || venue.country,
    parkingDetail,
    generalRule,
    boxOffice
  }
}

export async function localizeEventCopy<T extends {
  info?: string
  pleaseNote?: string
  country?: string
  venueDetail?: {
    address?: string
    country?: string
    parkingDetail?: string
    generalRule?: string
    boxOffice?: string
  }
}>(detail: T): Promise<T> {
  const [info, pleaseNote, venueDetail] = await Promise.all([
    translateToTurkish(detail.info, { force: true }),
    translateToTurkish(detail.pleaseNote, { force: true }),
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
