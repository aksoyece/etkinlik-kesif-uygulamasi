import { z } from 'zod'
import type { EventFilterState, EventSearchParams } from '../types/event'
import { nowTicketmasterDateTime, toTicketmasterDateTime } from './event'

export const PAGE_SIZE = 12
export const MAX_RESULTS = 1000
export const ALL_FILTER_VALUE = 'all'

export const CITY_OPTIONS = [
  { label: 'Tüm şehirler', value: ALL_FILTER_VALUE },
  { label: 'New York', value: 'New York' },
  { label: 'Los Angeles', value: 'Los Angeles' },
  { label: 'Chicago', value: 'Chicago' },
  { label: 'Miami', value: 'Miami' },
  { label: 'Las Vegas', value: 'Las Vegas' },
  { label: 'San Francisco', value: 'San Francisco' },
  { label: 'Boston', value: 'Boston' },
  { label: 'Nashville', value: 'Nashville' },
  { label: 'Austin', value: 'Austin' },
  { label: 'London', value: 'London' },
  { label: 'Manchester', value: 'Manchester' },
  { label: 'Toronto', value: 'Toronto' },
  { label: 'Vancouver', value: 'Vancouver' },
  { label: 'Berlin', value: 'Berlin' },
  { label: 'Amsterdam', value: 'Amsterdam' },
  { label: 'Paris', value: 'Paris' },
  { label: 'Dublin', value: 'Dublin' },
  { label: 'Sydney', value: 'Sydney' },
  { label: 'Melbourne', value: 'Melbourne' }
] as const

export const DEFAULT_CATEGORY_OPTIONS = [
  { label: 'Tüm kategoriler', value: ALL_FILTER_VALUE },
  { label: 'Müzik', value: 'Music' },
  { label: 'Spor', value: 'Sports' },
  { label: 'Sanat ve Tiyatro', value: 'Arts & Theatre' },
  { label: 'Film', value: 'Film' },
  { label: 'Diğer', value: 'Miscellaneous' }
]

export const SORT_OPTIONS = [
  { label: 'Tarihe göre (yakın)', value: 'date,asc' },
  { label: 'Tarihe göre (uzak)', value: 'date,desc' },
  { label: 'İsme göre (A-Z)', value: 'name,asc' },
  { label: 'İsme göre (Z-A)', value: 'name,desc' },
  { label: 'İlgiye göre', value: 'relevance,desc' },
  { label: 'Mekan adına göre', value: 'venueName,asc' }
] as const

export const eventFilterSchema = z.object({
  keyword: z
    .string()
    .trim()
    .max(80, 'Arama en fazla 80 karakter olabilir')
    .refine(value => value.length === 0 || value.length >= 2, 'En az 2 karakter yazın'),
  city: z.string().optional().default(''),
  classificationName: z.string().optional().default(''),
  startDate: z.string().optional().default(''),
  endDate: z.string().optional().default(''),
  sort: z.string().optional().default('date,asc')
}).refine((value) => {
  if (!value.startDate || !value.endDate) {
    return true
  }

  return value.startDate <= value.endDate
}, {
  message: 'Bitiş tarihi başlangıç tarihinden önce olamaz',
  path: ['endDate']
})

export const defaultFilterState = (): EventFilterState => ({
  keyword: '',
  city: ALL_FILTER_VALUE,
  classificationName: ALL_FILTER_VALUE,
  startDate: '',
  endDate: '',
  sort: 'date,asc'
})

export function filtersFromQuery(query: Record<string, unknown>): EventFilterState {
  const read = (key: string) => {
    const value = query[key]
    return typeof value === 'string' ? value : ''
  }

  return {
    keyword: read('keyword'),
    city: read('city') || ALL_FILTER_VALUE,
    classificationName: read('category') || ALL_FILTER_VALUE,
    startDate: read('startDate'),
    endDate: read('endDate'),
    sort: read('sort') || 'date,asc'
  }
}

export function filtersToQuery(filters: EventFilterState, page = 1): Record<string, string> {
  const query: Record<string, string> = {}

  if (filters.keyword) query.keyword = filters.keyword
  if (filters.city && filters.city !== ALL_FILTER_VALUE) query.city = filters.city
  if (filters.classificationName && filters.classificationName !== ALL_FILTER_VALUE) {
    query.category = filters.classificationName
  }
  if (filters.startDate) query.startDate = filters.startDate
  if (filters.endDate) query.endDate = filters.endDate
  if (filters.sort && filters.sort !== 'date,asc') query.sort = filters.sort
  if (page > 1) query.page = String(page)

  return query
}

export function toSearchParams(filters: EventFilterState, page = 1, size = PAGE_SIZE): EventSearchParams {
  return {
    keyword: filters.keyword || undefined,
    city: filters.city && filters.city !== ALL_FILTER_VALUE ? filters.city : undefined,
    classificationName: filters.classificationName && filters.classificationName !== ALL_FILTER_VALUE
      ? filters.classificationName
      : undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    sort: filters.sort || 'date,asc',
    page,
    size
  }
}

export function toTicketmasterQuery(params: EventSearchParams): Record<string, string> {
  const page = Math.max(1, params.page ?? 1)
  const size = Math.min(Math.max(params.size ?? PAGE_SIZE, 1), 20)
  const apiPage = page - 1
  const maxPage = Math.max(0, Math.floor(MAX_RESULTS / size) - 1)

  const query: Record<string, string> = {
    size: String(size),
    page: String(Math.min(apiPage, maxPage)),
    sort: params.sort || 'date,asc',
    includeTest: 'no'
  }

  if (params.keyword) query.keyword = params.keyword
  if (params.city) query.city = params.city
  if (params.classificationName) query.classificationName = params.classificationName

  query.startDateTime = toTicketmasterDateTime(params.startDate) || nowTicketmasterDateTime()

  const endDateTime = toTicketmasterDateTime(params.endDate, true)
  if (endDateTime) {
    query.endDateTime = endDateTime
  }

  return query
}

export function capTotalResults(totalElements = 0, size = PAGE_SIZE): number {
  return Math.min(totalElements, MAX_RESULTS - (MAX_RESULTS % size))
}
