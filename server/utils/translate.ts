import { localizeTicketmasterText, looksMostlyEnglish } from '#shared/utils/localize'

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
      timeout: 5000
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
    // sessizce sözlüğe düş
  }

  return localizeTicketmasterText(text) || text
}

/**
 * İngilizce Ticketmaster metnini Türkçeye çevirir.
 * Önce sözlük, yetmezse MyMemory; hata olursa orijinal/sözlük sonucu.
 */
export async function translateToTurkish(text?: string | null): Promise<string | undefined> {
  if (text == null) {
    return undefined
  }

  const trimmed = text.trim()
  if (!trimmed) {
    return text
  }

  const phrased = localizeTicketmasterText(trimmed) || trimmed
  if (!looksMostlyEnglish(phrased)) {
    return phrased
  }

  const parts = chunkText(phrased)
  const translatedParts = await Promise.all(parts.map(part => translateChunk(part)))
  return translatedParts.join(' ').replace(/\s+/g, ' ').trim()
}

export async function localizeEventCopy<T extends {
  info?: string
  pleaseNote?: string
  venueDetail?: {
    parkingDetail?: string
    generalRule?: string
    boxOffice?: string
  }
}>(detail: T): Promise<T> {
  const [info, pleaseNote, parkingDetail, generalRule, boxOffice] = await Promise.all([
    translateToTurkish(detail.info),
    translateToTurkish(detail.pleaseNote),
    translateToTurkish(detail.venueDetail?.parkingDetail),
    translateToTurkish(detail.venueDetail?.generalRule),
    translateToTurkish(detail.venueDetail?.boxOffice)
  ])

  return {
    ...detail,
    info,
    pleaseNote,
    venueDetail: detail.venueDetail
      ? {
          ...detail.venueDetail,
          parkingDetail,
          generalRule,
          boxOffice
        }
      : detail.venueDetail
  }
}
