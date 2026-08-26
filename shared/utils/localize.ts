/**
 * Ticketmaster metinlerini Türkçeleştirme yardımcıları.
 *
 * ÖNEMLİ: Kelime kelime değiştirme YAPILMAZ (Standing→Ayakta gibi karışık metin üretir).
 * Uzun İngilizce metinler sunucuda tam cümle makine çevirisiyle çevrilir.
 * Burada yalnızca güvenli post-fix’ler (gün, saat, ülke) ve kısa tam kalıplar vardır.
 */

const TURKISH_CHAR = /[ğüşıöçĞÜŞİÖÇ]/

const COUNTRY_TR: Record<string, string> = {
  'Great Britain': 'Birleşik Krallık',
  'United Kingdom': 'Birleşik Krallık',
  'UK': 'Birleşik Krallık',
  'England': 'İngiltere',
  'Scotland': 'İskoçya',
  'Wales': 'Galler',
  'Northern Ireland': 'Kuzey İrlanda',
  'Ireland': 'İrlanda',
  'United States': 'Amerika Birleşik Devletleri',
  'United States of America': 'Amerika Birleşik Devletleri',
  'USA': 'ABD',
  'Turkey': 'Türkiye',
  'Türkiye': 'Türkiye',
  'Germany': 'Almanya',
  'France': 'Fransa',
  'Spain': 'İspanya',
  'Italy': 'İtalya',
  'Netherlands': 'Hollanda',
  'Belgium': 'Belçika',
  'Australia': 'Avustralya',
  'Canada': 'Kanada'
}

const DAY_TR: Array<[RegExp, string]> = [
  [/\bMondays?\b/gi, 'Pazartesi'],
  [/\bTuesdays?\b/gi, 'Salı'],
  [/\bWednesdays?\b/gi, 'Çarşamba'],
  [/\bThursdays?\b/gi, 'Perşembe'],
  [/\bFridays?\b/gi, 'Cuma'],
  [/\bSaturdays?\b/gi, 'Cumartesi'],
  [/\bSundays?\b/gi, 'Pazar']
]

/** Kısa, tam cümle / kalıp eşleşmeleri (kelime kelime değil) */
const KNOWN_FULL_PHRASES: Array<[RegExp, string]> = [
  [/^No video cameras or recording devices\.?$/i, 'Video kamera veya kayıt cihazı yasaktır.'],
  [/^No food\.?$/i, 'Yiyecek yok.'],
  [/^No bottles or cans\.?$/i, 'Şişe veya kutu yok.'],
  [/^No alcohol or illegal substances\.?$/i, 'Alkol veya yasadışı madde yok.'],
  [/Monday\s*[-–—]\s*Saturday\s+(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})\s+and occasionally on Sunday\.?/gi,
    'Pazartesi - Cumartesi $1:$2 - $3:$4 ve bazen Pazar günleri.'],
  [/Monday\s*[-–—]\s*Sunday/gi, 'Pazartesi - Pazar'],
  [/Monday\s*[-–—]\s*Saturday/gi, 'Pazartesi - Cumartesi'],
  [/\bBox Office will open (\d+) hours? before doors on the day of an event\s*\(excluding Belfast Giants games\)\.?/gi,
    'Etkinlik günü kapıların açılmasından $1 saat önce gişe açılır (Belfast Giants maçları hariç).'],
  [/\bBox Office will open (\d+) hours? before doors on the day of an event\.?/gi,
    'Etkinlik günü kapıların açılmasından $1 saat önce gişe açılır.'],
  [/\bA max(?:imum)? of (\d+) tickets? per person and per household applies\.?/gi,
    'Kişi ve hane başına en fazla $1 bilet geçerlidir.'],
  [/\bTickets in excess of (\d+) will be cancell?ed\.?/gi,
    '$1 adetten fazla bilet iptal edilir.'],
  [/\bPlease note:\s*/gi, 'Lütfen dikkat: '],
  [/\bNational car park at St\.?\s*Martins Lane\.?\s*Street parking very difficult\.?\s*Strongly advise public transport\.?/gi,
    'St. Martins Lane\'deki ulusal otopark. Sokak otoparkı çok zordur. Toplu taşıma kullanmanızı şiddetle tavsiye ederiz.'],
  [/\bStreet parking very difficult\.?/gi, 'Sokak otoparkı çok zordur.'],
  [/\bStrongly advise public transport\.?/gi, 'Toplu taşıma kullanmanızı şiddetle tavsiye ederiz.']
]

export function looksMostlyEnglish(text: string): boolean {
  const sample = text.trim()
  if (sample.length < 8) {
    return false
  }

  const letters = sample.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, '')
  if (letters.length < 8) {
    return false
  }

  const turkish = (sample.match(new RegExp(TURKISH_CHAR.source, 'g')) || []).length
  if (turkish / letters.length >= 0.12) {
    return false
  }

  // Yaygın İngilizce belirteçler — karışık metinde de İngilizce say
  if (/\b(the|and|for|with|from|will|are|is|not|into|your|please|monday|tuesday|wednesday|thursday|friday|saturday|sunday|am|pm|hours?|parking|venue|food|drink|step|into|across|could|you|be|last|person|standing|experience|facility)\b/i.test(sample)) {
    return true
  }

  return (letters.match(/[a-zA-Z]/g) || []).length / letters.length > 0.88
}

export function localizeCountryName(name?: string | null): string | undefined {
  if (name == null || !name.trim()) {
    return undefined
  }
  const trimmed = name.trim()
  return COUNTRY_TR[trimmed] || COUNTRY_TR[trimmed.replace(/\.$/, '')] || trimmed
}

export function localizeAddressLine(address?: string | null): string | undefined {
  if (address == null || !address.trim()) {
    return undefined
  }

  let result = address.trim()
  const countries = Object.keys(COUNTRY_TR).sort((a, b) => b.length - a.length)
  for (const en of countries) {
    const tr = COUNTRY_TR[en]
    if (!tr) continue
    result = result.replace(new RegExp(`\\b${en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'), tr)
  }
  return result
}

function to24Hour(hour: number, minute: string, meridiem: string): string {
  let h = hour % 12
  if (/pm/i.test(meridiem)) {
    h += 12
  }
  return `${String(h).padStart(2, '0')}:${minute}`
}

/** Gün adları, am/pm → 24 saat, ülke adları (güvenli post-fix) */
export function applyLocaleFixes(text: string): string {
  let result = text

  for (const [pattern, replacement] of DAY_TR) {
    result = result.replace(pattern, replacement)
  }

  // 9:30am / 9:30 am / 6:00pm
  result = result.replace(/\b(\d{1,2}):(\d{2})\s*(am|pm)\b/gi, (_, h, m, mer) => to24Hour(Number(h), m, mer))
  // 9am / 6pm
  result = result.replace(/\b(\d{1,2})\s*(am|pm)\b/gi, (_, h, mer) => to24Hour(Number(h), '00', mer))

  result = localizeAddressLine(result) || result

  return result
    .replace(/\s+\*/g, '\n*')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Bilinen kısa/tam kalıplar (makine çevirisi yokken yedek) */
export function applyKnownPhrases(text: string): string {
  let result = text
  for (const [pattern, replacement] of KNOWN_FULL_PHRASES) {
    result = result.replace(pattern, replacement)
  }
  return result
}

/**
 * Senkron güvenli yerelleştirme.
 * Uzun İngilizce paragrafları kelime kelime BOZMAZ — yalnızca gün/saat/ülke + bilinen kısa kalıplar.
 * Tam çeviri için sunucu translateToTurkish kullanın.
 */
export function localizeTicketmasterText(text?: string | null): string | undefined {
  if (text == null) {
    return undefined
  }

  const trimmed = text.trim()
  if (!trimmed) {
    return text
  }

  // Uzun İngilizce metinde kelime değişimi yapma — karışık dil üretir
  if (looksMostlyEnglish(trimmed) && trimmed.length > 80) {
    return applyLocaleFixes(trimmed)
  }

  return applyLocaleFixes(applyKnownPhrases(trimmed))
}
