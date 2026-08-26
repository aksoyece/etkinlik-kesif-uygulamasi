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

export function translateGenre(name?: string | null): string {
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
