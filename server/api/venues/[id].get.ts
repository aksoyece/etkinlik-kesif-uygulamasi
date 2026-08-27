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

  const query = getQuery(event)
  const wantLocale = query.locale === '1' || query.locale === 'true'

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

  if (wantLocale) {
    return await localizeVenueCopy(venue)
  }

  return localizeVenueShell(venue)
}, {
  maxAge: 60 * 60,
  swr: true,
  getKey: (event) => {
    const id = getRouterParam(event, 'id') || ''
    const query = getQuery(event)
    const wantLocale = query.locale === '1' || query.locale === 'true'
    return wantLocale ? `venue:v8:tr:${id}` : `venue:v8:shell:${id}`
  }
})
