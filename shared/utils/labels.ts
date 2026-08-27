/**
 * Kullanıcıya gösterilen kategori / tür / durum etiketleri (TR).
 * API value’ları İngilizce kalır; yalnızca görünen label çevrilir.
 */

const CATEGORY_TR: Record<string, string> = {
  'Music': 'Müzik',
  'Sports': 'Spor',
  'Arts & Theatre': 'Sanat & Tiyatro',
  'Arts & Theater': 'Sanat & Tiyatro',
  'Film': 'Film',
  'Family': 'Aile',
  'Miscellaneous': 'Diğer',
  'Undefined': 'Genel',
  'undefined': 'Genel'
}

const GENRE_TR: Record<string, string> = {
  'Rock': 'Rock',
  'Pop': 'Pop',
  'Jazz': 'Caz',
  'Classical': 'Klasik Müzik',
  'Metal': 'Metal',
  'Hip-Hop': 'Hip-Hop',
  'Hip Hop': 'Hip-Hop',
  'Rap': 'Rap',
  'Alternative': 'Alternatif',
  'Alternative Rock': 'Alternatif Rock',
  'Comedy': 'Komedi',
  'Theatre': 'Tiyatro',
  'Theater': 'Tiyatro',
  'Drama': 'Drama',
  'Dance': 'Dans',
  'Electronic': 'Elektronik',
  'Folk': 'Halk Müziği',
  'Blues': 'Blues',
  'Soul': 'Soul',
  'Reggae': 'Reggae',
  'Indie': 'Bağımsız',
  'Country': 'Country',
  'R&B': 'R&B',
  'World': 'Dünya Müziği',
  'Latin': 'Latin',
  'Opera': 'Opera',
  'Musical': 'Müzikal',
  'Ballet': 'Bale',
  'Children': 'Çocuk',
  'Family': 'Aile',
  'Other': 'Diğer',
  'Miscellaneous': 'Diğer',
  'Undefined': 'Genel',
  'Football': 'Futbol',
  'Soccer': 'Futbol',
  'NFL': 'Amerikan Futbolu',
  'American Football': 'Amerikan Futbolu',
  'Basketball': 'Basketbol',
  'Hockey': 'Hokey',
  'Baseball': 'Beyzbol',
  'Tennis': 'Tenis',
  'Boxing': 'Boks',
  'Wrestling': 'Güreş',
  'Rugby': 'Ragbi',
  'Cricket': 'Kriket',
  'Golf': 'Golf',
  'Motorsports': 'Motor Sporları',
  'Ice Hockey': 'Buz Hokeyi',
  'Magic': 'Sihir',
  'Circus': 'Sirk',
  'Lecture': 'Konferans',
  'Fine Art': 'Güzel Sanatlar'
}

const STATUS_TR: Record<string, string> = {
  onsale: 'Satışta',
  onSale: 'Satışta',
  offsale: 'Satış dışı',
  offSale: 'Satış dışı',
  cancelled: 'İptal edildi',
  canceled: 'İptal edildi',
  postponed: 'Ertelendi',
  rescheduled: 'Yeniden planlandı'
}

/** Arayüz sayı / tarih locale’i — pazar kodundan bağımsız her zaman TR */
export const UI_LOCALE = 'tr-TR'

/** NFL / Amerikan futbolu bağlamı — UK’de genre çoğu zaman “Football” */
export function isAmericanFootballContext(parts: {
  genre?: string | null
  subGenre?: string | null
  name?: string | null
  extra?: Array<string | null | undefined>
} = {}): boolean {
  const blob = [
    parts.genre,
    parts.subGenre,
    parts.name,
    ...(parts.extra || [])
  ]
    .filter(Boolean)
    .join(' ')
    .toUpperCase()

  if (!blob) {
    return false
  }
  if (/\bNFL\b/.test(blob)) {
    return true
  }
  if (/AMERICAN\s+FOOTBALL/.test(blob)) {
    return true
  }
  if (/\bSUPER\s*BOWL\b/.test(blob)) {
    return true
  }
  return false
}

export function translateCategory(name?: string | null): string {
  if (!name?.trim()) {
    return 'Genel'
  }
  const trimmed = name.trim()
  if (CATEGORY_TR[trimmed]) {
    return CATEGORY_TR[trimmed]
  }
  const upper = trimmed.toUpperCase()
  if (upper === 'UNDEFINED') return 'Genel'
  if (upper.includes('MUSIC')) return 'Müzik'
  if (upper.includes('SPORTS')) return 'Spor'
  if (upper.includes('ARTS') || upper.includes('THEATRE') || upper.includes('THEATER')) return 'Sanat & Tiyatro'
  if (upper.includes('FAMILY')) return 'Aile'
  if (upper.includes('FILM')) return 'Film'
  if (upper.includes('MISCELLANEOUS')) return 'Diğer'
  return trimmed
}

/** Segment boş / Miscellaneous / Undefined ise tür etiketi için yetersiz sayılır */
export function isVagueCategory(name?: string | null): boolean {
  if (!name?.trim()) {
    return true
  }
  const upper = name.trim().toUpperCase()
  return upper === 'UNDEFINED'
    || upper === 'MISCELLANEOUS'
    || upper === 'OTHER'
    || upper.includes('MISCELLANEOUS')
}

/**
 * Kart rozeti ve “Tür” alanı için ortak ham anahtar.
 * Vague segment’te genre/subGenre’ye düşer.
 */
export function resolveEventTypeKey(category?: string | null, genre?: string | null): string {
  if (!isVagueCategory(category) && category?.trim()) {
    return category.trim()
  }
  if (genre?.trim() && genre.trim().toUpperCase() !== 'UNDEFINED') {
    return genre.trim()
  }
  return category?.trim() || ''
}

/**
 * Rozet + Tür satırı aynı metni gösterir (aynı kaynak + çeviri).
 * NFL bağlamında “Spor/Futbol” yerine Amerikan Futbolu.
 */
export function resolveEventTypeLabel(
  category?: string | null,
  genre?: string | null,
  options?: { subGenre?: string | null, name?: string | null }
): string {
  if (isAmericanFootballContext({
    genre,
    subGenre: options?.subGenre,
    name: options?.name,
    extra: [category]
  })) {
    return 'Amerikan Futbolu'
  }

  const key = resolveEventTypeKey(category, genre)
  if (!key) {
    return 'Genel'
  }

  const upper = key.toUpperCase()
  if (
    CATEGORY_TR[key]
    || upper.includes('MUSIC')
    || upper.includes('SPORTS')
    || upper.includes('ARTS')
    || upper.includes('THEATRE')
    || upper.includes('THEATER')
    || upper.includes('FAMILY')
    || upper.includes('FILM')
    || upper.includes('MISCELLANEOUS')
  ) {
    return translateCategory(key)
  }

  return translateGenre(key, { subGenre: options?.subGenre, name: options?.name })
}

export function translateGenre(
  name?: string | null,
  options?: { subGenre?: string | null, name?: string | null }
): string {
  if (isAmericanFootballContext({
    genre: name,
    subGenre: options?.subGenre,
    name: options?.name
  })) {
    return 'Amerikan Futbolu'
  }

  if (!name?.trim()) {
    return 'Genel'
  }
  const trimmed = name.trim()
  if (GENRE_TR[trimmed]) {
    return GENRE_TR[trimmed]
  }
  const upper = trimmed.toUpperCase()
  if (upper === 'UNDEFINED') return 'Genel'
  // Bilinen kalıplar
  if (upper.includes('HIP') && upper.includes('HOP')) return 'Hip-Hop'
  if (upper.includes('ELECTRONIC') || upper === 'DANCE/ELECTRONIC') return 'Elektronik'
  if (upper.includes('CLASSICAL')) return 'Klasik Müzik'
  if (upper.includes('ALTERNATIVE')) return 'Alternatif'
  if (upper.includes('THEATRE') || upper.includes('THEATER')) return 'Tiyatro'
  if (upper.includes('CHILDREN') || upper.includes('KIDS')) return 'Çocuk'
  if (upper === 'NFL' || upper.includes('AMERICAN FOOTBALL')) return 'Amerikan Futbolu'
  return trimmed
}

export function translateStatus(code?: string | null): string {
  if (!code?.trim()) {
    return ''
  }
  const key = code.trim()
  return STATUS_TR[key] || STATUS_TR[key.toLowerCase()] || key
}

export function formatUiNumber(value: number): string {
  return value.toLocaleString(UI_LOCALE)
}
