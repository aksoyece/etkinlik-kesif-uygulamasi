import { describe, expect, it } from 'vitest'
import { localizeAddressLine, localizeTicketmasterText, looksMostlyEnglish } from '../shared/utils/localize'

describe('yerelleştirme', () => {
  it('İngilizce metni tanır', () => {
    expect(looksMostlyEnglish('A max of 8 tickets per person applies.')).toBe(true)
    expect(looksMostlyEnglish('Kişi başına en fazla 8 bilet geçerlidir.')).toBe(false)
  })

  it('hediye kartı uyarısını Türkçeleştirir', () => {
    const input = 'Please note: Giftcards are only valid against tickets brough from Ticketmaster and are not redeemable in the gift shop or cafe.'
    const out = localizeTicketmasterText(input) || ''
    expect(out.toLowerCase()).toContain('lütfen dikkat')
    expect(out.toLowerCase()).toContain('hediye')
    expect(out.toLowerCase()).toContain('ticketmaster')
  })

  it('bilet limiti uyarısını Türkçeleştirir', () => {
    const input = 'A max of 8 tickets per person and per household applies. Tickets in excess of 8 will be cancelled.'
    const out = localizeTicketmasterText(input) || ''
    expect(out).toMatch(/en fazla 8 bilet/i)
    expect(out).toMatch(/iptal/i)
  })

  it('gişe ve ülke bilgisini Türkçeleştirir', () => {
    const box = localizeTicketmasterText(
      'Box Office will open 1 hour before doors on the day of an event (excluding Belfast Giants games)'
    ) || ''
    expect(box.toLowerCase()).toMatch(/gişe|kapı/)
    expect(box.toLowerCase()).toMatch(/belfast giants/)

    const address = localizeAddressLine('2 Queens Quay, Belfast, BT39QQ, Great Britain') || ''
    expect(address).toContain('Birleşik Krallık')
    expect(address).not.toMatch(/Great Britain/i)
  })

  it('mekan kurallarını Türkçeleştirir', () => {
    const rules = localizeTicketmasterText(
      '* Food and drink is NOT allowed to be brought into the venue. * The arena sells a variety of snack foods and confectionary and hot and cold drinks.'
    ) || ''
    expect(rules.toLowerCase()).toMatch(/yasak|yiyecek/)
    expect(rules.toLowerCase()).toMatch(/arena|atıştırmalık|içecek/)
  })
})
