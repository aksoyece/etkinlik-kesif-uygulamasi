/**
 * Ticketmaster / UI metinlerini Türkçeye yaklaştırır.
 * Önce kalıp sözlük, gerekirse sunucuda makine çevirisi kullanılır.
 */

const TURKISH_CHAR = /[ğüşıöçĞÜŞİÖÇ]/

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

  if (turkish / letters.length >= 0.06) {
    return false
  }

  // Yaygın İngilizce belirteçler
  if (/\b(please|ticket|tickets|venue|doors|age|restriction|valid|redeemable|household|cancelled|canceled|gift\s*card)\b/i.test(sample)) {
    return true
  }

  return asciiLatin / letters.length > 0.92
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
  [/\bBox office\b/gi, 'Gişe'],
  [/\bParking\b/gi, 'Otopark'],
  [/\bGeneral admission\b/gi, 'Genel giriş'],
  [/\bStanding\b/gi, 'Ayakta'],
  [/\bSeated\b/gi, 'Oturarak'],
  [/\bAccessible seating\b/gi, 'Engelli oturma alanı'],
  [/\bSold out\b/gi, 'Tükendi'],
  [/\bOn sale\b/gi, 'Satışta'],
  [/\bOff sale\b/gi, 'Satış dışı']
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

  if (!looksMostlyEnglish(trimmed)) {
    return text
  }

  let result = trimmed
  for (const [pattern, replacement] of PHRASE_REPLACEMENTS) {
    result = result.replace(pattern, replacement)
  }

  return result
}
