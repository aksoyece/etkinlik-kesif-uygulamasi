import { describe, expect, it, vi, afterEach } from 'vitest'
import { isValidTicketUrl, resolveTicketUrl } from '../shared/utils/ticketUrl'

describe('ticketUrl doğrulama', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('geçerli Ticketmaster / eticketing URL’lerini kabul eder', () => {
    expect(isValidTicketUrl('https://www.ticketmaster.co.uk/event/abc')).toBe(true)
    expect(isValidTicketUrl('https://www.eticketing.co.uk/arsenal/EDP/Event/Index/1')).toBe(true)
  })

  it('queue-it.net hostlarını reddeder', () => {
    expect(isValidTicketUrl('https://ticketmastersportuk.queue-it.net/softblock/?c=x')).toBe(false)
    expect(isValidTicketUrl('https://queue-it.net/waitingroom')).toBe(false)
  })

  it('queueittoken içeren URL’leri reddeder', () => {
    expect(isValidTicketUrl('https://www.ticketmaster.co.uk/event/abc?queueittoken=e_xxx')).toBe(false)
  })

  it('boş / geçersiz URL’leri reddeder', () => {
    expect(isValidTicketUrl(undefined)).toBe(false)
    expect(isValidTicketUrl('')).toBe(false)
    expect(isValidTicketUrl('not-a-url')).toBe(false)
  })

  it('resolveTicketUrl geçerli URL döner, kirli URL’yi loglayıp düşürür', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(resolveTicketUrl('https://www.ticketmaster.co.uk/e/1', { eventId: 'evt-1' }))
      .toBe('https://www.ticketmaster.co.uk/e/1')

    expect(resolveTicketUrl(
      'https://ticketmastersportuk.queue-it.net/?queueittoken=abc',
      { eventId: 'evt-2' }
    )).toBeUndefined()

    expect(warn).toHaveBeenCalledWith(
      '[ticket-url] Queue-it veya oturuma özel bilet URL’si reddedildi',
      expect.objectContaining({ eventId: 'evt-2' })
    )
  })
})
