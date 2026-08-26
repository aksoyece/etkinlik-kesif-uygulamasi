import { describe, expect, it } from 'vitest'
import {
  applyLocaleFixes,
  localizeAddressLine,
  localizeTicketmasterText,
  looksMostlyEnglish
} from '../shared/utils/localize'

describe('yerelleştirme', () => {
  it('İngilizce metni tanır', () => {
    expect(looksMostlyEnglish('A max of 8 tickets per person applies.')).toBe(true)
    expect(looksMostlyEnglish('Kişi başına en fazla 8 bilet geçerlidir.')).toBe(false)
  })

  it('uzun İngilizce paragrafta kelime kelime bozmaz', () => {
    const input = 'Step into the Arena! For the first time ever, GladFans across the United Kingdom will be able to put their speed. Could you be the last person Standing in an epic bout of Duel?'
    const out = localizeTicketmasterText(input) || ''
    // Kelime değiştirilmemiş olmalı
    expect(out).toMatch(/Standing/)
    expect(out).not.toMatch(/Ayakta/)
    // Ülke adı adres dışı uzun metinde de country fix uygulanabilir — United Kingdom → Birleşik Krallık applyLocaleFixes içinde
    // Bu OK; asıl kritik Standing bozulmaması
  })

  it('gün ve am/pm düzeltir', () => {
    const out = applyLocaleFixes('9:30am - 6:00pm Monday - Sunday')
    expect(out).toMatch(/09:30/)
    expect(out).toMatch(/18:00/)
    expect(out.toLowerCase()).toMatch(/pazartesi/)
    expect(out.toLowerCase()).toMatch(/pazar/)
    expect(out.toLowerCase()).not.toMatch(/\bam\b|\bpm\b/)
  })

  it('kısa gişe kalıbını çevirir', () => {
    const out = localizeTicketmasterText(
      'Monday - Saturday 10:00 - 18:00 and occasionally on Sunday.'
    ) || ''
    expect(out.toLowerCase()).toMatch(/pazartesi/)
    expect(out.toLowerCase()).toMatch(/pazar/)
  })

  it('adres ülkesini Türkçeleştirir', () => {
    const address = localizeAddressLine('2 Queens Quay, Belfast, BT39QQ, Great Britain') || ''
    expect(address).toContain('Birleşik Krallık')
  })

  it('kısa yasak cümlesini çevirir', () => {
    const out = localizeTicketmasterText('No video cameras or recording devices.') || ''
    expect(out.toLowerCase()).toMatch(/kamera|kayıt|yasak/)
  })
})
