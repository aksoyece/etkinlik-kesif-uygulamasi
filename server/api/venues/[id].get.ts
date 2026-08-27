import type { TicketmasterVenue, VenueSummary } from '#shared/types/event'
import { mapVenue } from '#shared/utils/event'

/** Mekan: orijinal TM metinleri; makine çevirisi yok */
export default defineCachedEventHandler(async (event): Promise<VenueSummary> => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Mekan kimliği gerekli.'
    })
  }

  const data = await ticketmasterFetch<TicketmasterVenue>(
    event,
    `/venues/${encodeURIComponent(id)}.json`
  )

  const venue = mapVenue(data)

  if (!venue) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Mekan bulunamadı.'
    })
  }

  return venue
}, {
  maxAge: 60 * 60,
  swr: true,
  getKey: event => `venue:v10:en:${getRouterParam(event, 'id') || ''}`
})
