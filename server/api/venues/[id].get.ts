import type { TicketmasterVenue, VenueSummary } from '#shared/types/event'
import { mapVenue } from '#shared/utils/event'

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

  // Mekan endpoint’i de async çeviriyle güçlendirilir (sözlük mapVenue’da zaten uygulandı)
  return await localizeVenueCopy(venue)
}, {
  maxAge: 60 * 30,
  swr: true,
  getKey: event => `venue:v5:tr:${getRouterParam(event, 'id') || ''}`
})
