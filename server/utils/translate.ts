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
 * Sözlük sonucu yeterince Türkçe ise makine çevirisine gitmez (İngilizce override engellenir).
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

  // Sözlük işini bitirdiyse olduğu gibi dön
  if (!looksMostlyEnglish(phrased)) {
    return phrased
  }

  if (!options.force && !looksMostlyEnglish(trimmed)) {
    return phrased
  }

  const parts = splitForTranslation(phrased)
  const translatedParts = await Promise.all(parts.map(async (part) => {
    const machine = await translateChunk(part)
    // Makine hâlâ İngilizceyse sözlük sonucunu koru
    if (looksMostlyEnglish(machine) && !looksMostlyEnglish(localizeTicketmasterText(part) || '')) {
      return localizeTicketmasterText(part) || part
    }
    if (looksMostlyEnglish(machine)) {
      return localizeTicketmasterText(part) || machine
    }
    return machine
  }))

  const joined = translatedParts.join(' ').replace(/[ \t]{2,}/g, ' ').trim()
  return looksMostlyEnglish(joined) ? phrased : joined
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
    translateToTurkish(venue.address, { force: true })
  ])

  return {
    ...venue,
    address: localizeAddressLine(address) || address,
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
  const [info, pleaseNote] = await Promise.all([
    translateToTurkish(detail.info),
    translateToTurkish(detail.pleaseNote)
  ])

  const venueDetail = detail.venueDetail
    ? await localizeVenueCopy(detail.venueDetail)
    : detail.venueDetail

  return {
    ...detail,
    info,
    pleaseNote,
    country: localizeCountryName(detail.country) || detail.country,
    venueDetail
  }
}
