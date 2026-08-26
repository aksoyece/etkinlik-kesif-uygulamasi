import { describe, expect, it } from 'vitest'
import { localizeTicketmasterText, looksMostlyEnglish } from '../shared/utils/localize'

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
})
