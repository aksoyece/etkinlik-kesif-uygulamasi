/**
 * Ticketmaster bilet URL doğrulama.
 * queue-it.net / queueittoken içeren URL’ler oturuma özeldir; asla cache’lenip paylaşılmaz.
 */

export function isValidTicketUrl(url?: string | null): boolean {
  if (!url?.trim()) {
    return false
  }

  try {
    const parsed = new URL(url.trim())
    const hostname = parsed.hostname.toLowerCase()

    if (hostname === 'queue-it.net' || hostname.endsWith('.queue-it.net')) {
      return false
    }

    if (parsed.searchParams.has('queueittoken')) {
      return false
    }

    // Hostname dışı query/hash içinde de token olabilir
    if (/queueittoken=/i.test(url)) {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * Geçerliyse URL’i döner; Queue-it / token’lıysa reddedip loglar.
 */
export function resolveTicketUrl(
  url?: string | null,
  meta?: { eventId?: string }
): string | undefined {
  if (!url?.trim()) {
    return undefined
  }

  if (isValidTicketUrl(url)) {
    return url.trim()
  }

  console.warn('[ticket-url] Queue-it veya oturuma özel bilet URL’si reddedildi', {
    eventId: meta?.eventId,
    url
  })

  return undefined
}
