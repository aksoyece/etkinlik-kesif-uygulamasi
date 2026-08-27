import type { EventDetail, TicketmasterEvent } from '#shared/types/event'
import { mapTicketmasterEventDetail } from '#shared/utils/event'

export default defineCachedEventHandler(async (event): Promise<EventDetail> => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Etkinlik kimliği gerekli.'
    })
  }

  const query = getQuery(event)
  const wantLocale = query.locale === '1' || query.locale === 'true'

  const data = await ticketmasterFetch<TicketmasterEvent>(
    event,
    `/events/${encodeURIComponent(id)}.json`
  )

  const detail = mapTicketmasterEventDetail(data)

  // Varsayılan: mekan/adres/seatmap hemen (çeviri beklemez)
  // ?locale=1: info / pleaseNote / mekan prose makine çevirisi
  if (wantLocale) {
    return await localizeEventCopy(detail)
  }

  return localizeEventShell(detail)
}, {
  maxAge: 60 * 60,
  swr: true,
  getKey: (event) => {
    const id = getRouterParam(event, 'id') || ''
    const query = getQuery(event)
    const wantLocale = query.locale === '1' || query.locale === 'true'
    return wantLocale ? `event:v18:tr:${id}` : `event:v18:shell:${id}`
  }
})
