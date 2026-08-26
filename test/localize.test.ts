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

  it('O2 Belfast gişe / otopark / kuralları Türkçeleştirir', () => {
    const box = localizeTicketmasterText(
      'Box Office will open 1 hour before doors on the day of an event (excluding Belfast Giants games)'
    ) || ''
    expect(box.toLowerCase()).toMatch(/gişe|kapı|etkinlik/)
    expect(box.toLowerCase()).not.toMatch(/box office will open/)

    const park = localizeTicketmasterText(
      '1500 spaces are available, those closest to The O2 Belfast are reserved for vehicles showing the disabled driver badge.'
    ) || ''
    expect(park.toLowerCase()).toMatch(/araç|otopark|yer|engelli/)
    expect(park.toLowerCase()).not.toMatch(/spaces are available/)

    const rules = localizeTicketmasterText(
      '* Food and drink is NOT allowed to be brought into the venue. * The arena sells a variety of snack foods and confectionary and hot and cold drinks. * Food may be taken into the arena while patrons enjoy the game/event. * There is a fully licensed bar and the food outlets have a limited/occasional license depending on the nature of the event. * Please follow the link below for venue\'s full T&C\'s https://theo2belfast.com/your-visit/faqs'
    ) || ''
    expect(rules.toLowerCase()).toMatch(/yasak|yiyecek/)
    expect(rules.toLowerCase()).not.toMatch(/food and drink is not allowed/)

    const address = localizeAddressLine('2 Queens Quay, Belfast, BT39QQ, Great Britain') || ''
    expect(address).toContain('Birleşik Krallık')
  })
})
