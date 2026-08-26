/**
 * Ticketmaster / UI metinlerini Türkçeye yaklaştırır.
 * Önce kalıp sözlük, gerekirse sunucuda makine çevirisi kullanılır.
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

/** Metin ağırlıklı olarak İngilizce görünüyorsa true */
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
  const asciiLatin = (letters.match(/[a-zA-Z]/g) || []).length

  if (turkish / letters.length >= 0.08) {
    return false
  }

  if (/\b(please|ticket|tickets|venue|doors|age|restriction|valid|redeemable|household|cancelled|canceled|gift\s*card|box\s*office|parking|spaces?|allowed|arena|patrons?|licensed|food|drink)\b/i.test(sample)) {
    return true
  }

  return asciiLatin / letters.length > 0.9
}

export function localizeCountryName(name?: string | null): string | undefined {
  if (name == null || !name.trim()) {
    return undefined
  }
  const trimmed = name.trim()
  return COUNTRY_TR[trimmed] || COUNTRY_TR[trimmed.replace(/\.$/, '')] || trimmed
}

/** Adres satırındaki ülke adını Türkçeleştirir */
export function localizeAddressLine(address?: string | null): string | undefined {
  if (address == null || !address.trim()) {
    return undefined
  }

  let result = address.trim()
  const countries = Object.keys(COUNTRY_TR).sort((a, b) => b.length - a.length)
  for (const en of countries) {
    const tr = COUNTRY_TR[en]
    if (!tr) {
      continue
    }
    result = result.replace(new RegExp(`\\b${en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'), tr)
  }
  return result
}

const PHRASE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bPlease note:\s*/gi, 'Lütfen dikkat: '],
  [/\bPlease note\b/gi, 'Lütfen dikkat'],
  [/\bIMPORTANT:\s*/gi, 'ÖNEMLİ: '],
  [/\bNote:\s*/gi, 'Not: '],
  [/\bGift\s*-?\s*cards?\b/gi, 'Hediye kartları'],
  [/\bare only valid against tickets (?:brought|brough|bought) from Ticketmaster\b/gi, 'yalnızca Ticketmaster üzerinden alınan biletlerde geçerlidir'],
  [/\bare only valid (?:for|against) tickets purchased (?:from|via|through) Ticketmaster\b/gi, 'yalnızca Ticketmaster üzerinden alınan biletlerde geçerlidir'],
  [/\band are not redeemable in the gift shop or cafe\.?/gi, 've hediye dükkânı veya kafede kullanılamaz.'],
  [/\bA max(?:imum)? of (\d+) tickets? per person and per household applies\.?/gi, 'Kişi ve hane başına en fazla $1 bilet geçerlidir.'],
  [/\bTickets in excess of (\d+) will be cancelled\.?/gi, '$1 adetten fazla bilet iptal edilir.'],
  [/\bTickets in excess of (\d+) will be canceled\.?/gi, '$1 adetten fazla bilet iptal edilir.'],
  [/\bper person\b/gi, 'kişi başı'],
  [/\bper household\b/gi, 'hane başı'],
  [/\bwill be cancelled\b/gi, 'iptal edilir'],
  [/\bwill be canceled\b/gi, 'iptal edilir'],

  // Mekan / gişe / otopark
  [/\bBox Office will open (\d+) hours? before doors on the day of an event\b/gi, 'Etkinlik günü kapıların açılmasından $1 saat önce gişe açılır'],
  [/\bBox Office will open (\d+) hour before doors on the day of an event\b/gi, 'Etkinlik günü kapıların açılmasından $1 saat önce gişe açılır'],
  [/\b\(excluding Belfast Giants games\)/gi, '(Belfast Giants maçları hariç)'],
  [/\bexcluding ([^)]+ games?)\b/gi, '$1 hariç'],
  [/\b(\d+)\s+spaces? are available\b/gi, '$1 araçlık yer mevcuttur'],
  [/\bthose closest to (.+?) are reserved for vehicles showing the disabled driver badge\.?/gi, 'mekana en yakın yerler engelli sürücü rozeti gösteren araçlara ayrılmıştır.'],
  [/\bdisabled driver badge\b/gi, 'engelli sürücü rozeti'],
  [/\bBox [Oo]ffice\b/gi, 'Gişe'],
  [/\bwill open\b/gi, 'açılır'],
  [/\bbefore doors\b/gi, 'kapıların açılmasından önce'],
  [/\bon the day of an event\b/gi, 'etkinlik günü'],
  [/\bParking\b/gi, 'Otopark'],

  // Genel kurallar
  [/\bFood and drink is NOT allowed to be brought into the venue\.?/gi, 'Yiyecek ve içeceğin mekâna getirilmesi YASAKTIR.'],
  [/\bFood and drinks? (?:are|is) NOT allowed to be brought into the venue\.?/gi, 'Yiyecek ve içeceğin mekâna getirilmesi YASAKTIR.'],
  [/\bThe arena sells a variety of snack foods and confectionary and hot and cold drinks\.?/gi, 'Arenada çeşitli atıştırmalıklar, şekerlemeler ile sıcak ve soğuk içecekler satılır.'],
  [/\bFood may be taken into the arena while patrons enjoy the game\/event\.?/gi, 'Ziyaretçiler maç/etkinlik sırasında arenaya yiyecek alabilir.'],
  [/\bThere is a fully licensed bar and the food outlets have a limited\/occasional license depending on the nature of the event\.?/gi, 'Tam lisanslı bir bar vardır; yiyecek noktalarının lisansı etkinliğin türüne göre sınırlı/geçici olabilir.'],
  [/\bPlease follow the link below for venue'?s? full T&C'?s?\b/gi, 'Mekânın tüm şart ve koşulları için aşağıdaki bağlantıyı ziyaret edin'],
  [/\bT&C'?s?\b/gi, 'şartlar ve koşullar'],
  [/\bDoors open\b/gi, 'Kapılar açılır'],
  [/\bAge restriction\b/gi, 'Yaş sınırı'],
  [/\bUnder (\d+)s?\b/gi, '$1 yaş altı'],
  [/\bmust be accompanied by an adult\b/gi, 'bir yetişkinle birlikte olmalıdır'],
  [/\bNo refunds?\b/gi, 'İade yok'],
  [/\bNo exchanges?\b/gi, 'Değişim yok'],
  [/\bSubject to availability\b/gi, 'Müsaitliğe bağlıdır'],
  [/\bRunning time\b/gi, 'Süre'],
  [/\bapproximately\b/gi, 'yaklaşık'],
  [/\bincluding interval\b/gi, 'ara dahil'],
  [/\bGeneral admission\b/gi, 'Genel giriş'],
  [/\bStanding\b/gi, 'Ayakta'],
  [/\bSeated\b/gi, 'Oturarak'],
  [/\bAccessible seating\b/gi, 'Engelli oturma alanı'],
  [/\bSold out\b/gi, 'Tükendi'],
  [/\bOn sale\b/gi, 'Satışta'],
  [/\bOff sale\b/gi, 'Satış dışı'],
  [/\bGreat Britain\b/gi, 'Birleşik Krallık'],
  [/\bUnited Kingdom\b/gi, 'Birleşik Krallık']
]

/** Sözlük / kalıp ile hızlı yerelleştirme (senkron) */
export function localizeTicketmasterText(text?: string | null): string | undefined {
  if (text == null) {
    return undefined
  }

  const trimmed = text.trim()
  if (!trimmed) {
    return text
  }

  let result = localizeAddressLine(trimmed) || trimmed

  // Zaten Türkçe ise yalnızca ülke adı düzeltmesi yeterli
  if (!looksMostlyEnglish(result)) {
    return result
  }

  for (const [pattern, replacement] of PHRASE_REPLACEMENTS) {
    result = result.replace(pattern, replacement)
  }

  // Madde işaretlerini koru, fazla boşlukları sadeleştir
  result = result
    .replace(/\s+\*/g, '\n*')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return result
}
