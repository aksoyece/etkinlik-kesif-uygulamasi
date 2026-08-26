import type { EventListResult, TicketmasterEventSearchResponse } from '#shared/types/event'
import { mapTicketmasterEvent } from '#shared/utils/event'
import { capTotalResults, PAGE_SIZE, toTicketmasterQuery } from '#shared/utils/filters'

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export default defineCachedEventHandler(async (event): Promise<EventListResult> => {
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const size = Math.min(20, Math.max(1, Number(query.size) || PAGE_SIZE))

  const data = await ticketmasterFetch<TicketmasterEventSearchResponse>(event, '/events.json', toTicketmasterQuery({
    keyword: readString(query.keyword),
    city: readString(query.city),
    classificationName: readString(query.classificationName),
    startDate: readString(query.startDate),
    endDate: readString(query.endDate),
    sort: readString(query.sort),
    page,
    size
  }))

  const total = capTotalResults(data.page?.totalElements ?? 0, size)

  return {
    events: (data._embedded?.events ?? []).map(mapTicketmasterEvent),
    page,
    size,
    total,
    totalPages: Math.max(1, Math.ceil(total / size) || 1)
  }
}, {
  maxAge: 60 * 5,
  swr: true,
  getKey: (event) => {
    const query = getQuery(event)
    return [
      'events',
      'TR',
      query.keyword,
      query.city,
      query.classificationName,
      query.startDate,
      query.endDate,
      query.sort,
      query.page,
      query.size
    ].join(':')
  }
})
