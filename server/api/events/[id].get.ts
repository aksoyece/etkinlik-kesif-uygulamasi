import type { EventDetail, TicketmasterEvent } from '#shared/types/event'
import { mapTicketmasterEventDetail } from '#shared/utils/event'

/**
 * Detay: orijinal Ticketmaster metinleri (İngilizce prose).
 * Makine çevirisi yok — karışık dil / language flash olmasın.
 */
export default defineCachedEventHandler(async (event): Promise<EventDetail> => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Etkinlik kimliği gerekli.'
    })
  }

  const data = await ticketmasterFetch<TicketmasterEvent>(
    event,
    `/events/${encodeURIComponent(id)}.json`
  )

  return mapTicketmasterEventDetail(data)
}, {
  maxAge: 60 * 60,
  swr: true,
  getKey: event => `event:v20:en:${getRouterParam(event, 'id') || ''}`
})
