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

  const data = await ticketmasterFetch<TicketmasterEvent>(
    event,
    `/events/${encodeURIComponent(id)}.json`
  )

  const detail = mapTicketmasterEventDetail(data)
  return await localizeEventCopy(detail)
}, {
  maxAge: 60 * 30,
  swr: true,
  getKey: event => `event:v13:img:${getRouterParam(event, 'id') || ''}`
})
