import { describe, expect, it } from 'vitest'
import {
  translateCategory,
  translateGenre,
  translateStatus,
  formatUiNumber,
  resolveEventTypeLabel,
  resolveEventTypeKey
} from '../shared/utils/labels'

describe('etiket çevirileri', () => {
  it('kategorileri Türkçeleştirir', () => {
    expect(translateCategory('Music')).toBe('Müzik')
    expect(translateCategory('Family')).toBe('Aile')
    expect(translateCategory('Undefined')).toBe('Genel')
  })

  it('türleri Türkçeleştirir', () => {
    expect(translateGenre('Jazz')).toBe('Caz')
    expect(translateGenre('Classical')).toBe('Klasik Müzik')
    expect(translateGenre('Undefined')).toBe('Genel')
  })

  it('Miscellaneous segment’te genre ile tutarlı tür etiketi üretir', () => {
    expect(resolveEventTypeKey('Miscellaneous', 'Family')).toBe('Family')
    expect(resolveEventTypeLabel('Miscellaneous', 'Family')).toBe('Aile')
    expect(resolveEventTypeLabel('Music', 'Jazz')).toBe('Müzik')
    expect(resolveEventTypeLabel('Sports', 'Football')).toBe('Spor')
  })

  it('durum kodlarını Türkçeleştirir', () => {
    expect(translateStatus('onsale')).toBe('Satışta')
    expect(translateStatus('offsale')).toBe('Satış dışı')
    expect(translateStatus('cancelled')).toBe('İptal edildi')
  })

  it('sayıları tr-TR formatlar', () => {
    expect(formatUiNumber(1000)).toMatch(/1[. ]000|1,000/)
  })
})
