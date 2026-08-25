import type {
  ClassificationOption,
  TicketmasterClassificationSearchResponse
} from '#shared/types/event'

export default defineCachedEventHandler(async (event): Promise<ClassificationOption[]> => {
  const data = await ticketmasterFetch<TicketmasterClassificationSearchResponse>(
    event,
    '/classifications.json',
    { size: 20 }
  )

  const unique = new Map<string, ClassificationOption>()

  for (const item of data._embedded?.classifications ?? []) {
    const segment = item.segment
    if (segment?.name && segment.name !== 'Undefined' && !unique.has(segment.name)) {
      unique.set(segment.name, {
        id: segment.id || segment.name,
        name: segment.name
      })
    }
  }

  return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name, 'en'))
}, {
  maxAge: 60 * 60
})
