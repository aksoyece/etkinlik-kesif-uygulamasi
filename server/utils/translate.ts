import {
  localizeAddressLine,
  localizeCountryName,
  localizeTicketmasterText,
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

/** Uzun mekan kurallarını madde / cümle bazında böl */
function splitForTranslation(text: string): string[] {
  const bulletParts = text
    .split(/(?=\*\s)/)
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
    ) {
      translationCache.set(text, translated)
      return translated
    }
  } catch {
    // sözlüğe düş
  }

  return localizeTicketmasterText(text) || text
}

/**
 * İngilizce Ticketmaster metnini Türkçeye çevirir.
 * @param force İngilizce tespitini atla (mekan alanları için)
 */
export async function translateToTurkish(
  text?: string | null,
  options: { force?: boolean } = {}
): Promise<string | undefined> {
  if (text == null) {
    return undefined
  }

  const trimmed = text.trim()
  if (!trimmed) {
    return text
  }

  const phrased = localizeTicketmasterText(trimmed) || trimmed
  if (!options.force && !looksMostlyEnglish(phrased)) {
    return phrased
  }

  // Sözlük sonrası hâlâ İngilizce ise (veya force) makine çevirisi dene
  if (!looksMostlyEnglish(phrased) && !options.force) {
    return phrased
  }

  // Force ama sözlük yeterli Türkçeleştirdiyse makineye gerek yok
  if (options.force && !looksMostlyEnglish(phrased)) {
    return phrased
  }

  const parts = splitForTranslation(phrased)
  const translatedParts = await Promise.all(parts.map(part => translateChunk(part)))
  return translatedParts.join(' ').replace(/[ \t]{2,}/g, ' ').trim()
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
  const venue = detail.venueDetail

  const [
    info,
    pleaseNote,
    parkingDetail,
    generalRule,
    boxOffice,
    address
  ] = await Promise.all([
    translateToTurkish(detail.info),
    translateToTurkish(detail.pleaseNote),
    translateToTurkish(venue?.parkingDetail, { force: true }),
    translateToTurkish(venue?.generalRule, { force: true }),
    translateToTurkish(venue?.boxOffice, { force: true }),
    translateToTurkish(venue?.address, { force: true })
  ])

  return {
    ...detail,
    info,
    pleaseNote,
    country: localizeCountryName(detail.country) || detail.country,
    venueDetail: venue
      ? {
          ...venue,
          address: localizeAddressLine(address) || address,
          country: localizeCountryName(venue.country) || venue.country,
          parkingDetail,
          generalRule,
          boxOffice
        }
      : venue
  }
}
