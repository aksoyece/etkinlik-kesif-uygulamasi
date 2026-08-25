import type { H3Event } from 'h3'

interface TicketmasterErrorBody {
  fault?: {
    faultstring?: string
  }
  errors?: Array<{ detail?: string, status?: string }>
}

export async function ticketmasterFetch<T>(
  event: H3Event,
  path: string,
  query: Record<string, string | number | undefined> = {}
): Promise<T> {
  const config = useRuntimeConfig(event)
  const apiKey = config.ticketmasterApiKey

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Ticketmaster API anahtarı tanımlı değil. .env dosyasındaki NUXT_TICKETMASTER_API_KEY değerini kontrol edin.'
    })
  }

  const params: Record<string, string> = {
    apikey: apiKey
  }

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      params[key] = String(value)
    }
  }

  try {
    return await $fetch<unknown>(`${config.ticketmasterBaseUrl}${path}`, {
      query: params
    }) as T
  } catch (error: unknown) {
    const fetchError = error as {
      statusCode?: number
      status?: number
      data?: TicketmasterErrorBody
    }
    const status = fetchError.statusCode || fetchError.status || 502
    const detail = fetchError.data?.fault?.faultstring
      || fetchError.data?.errors?.[0]?.detail

    throw createError({
      statusCode: status >= 400 && status < 600 ? status : 502,
      statusMessage: status === 429
        ? 'Ticketmaster istek limiti aşıldı. Lütfen biraz sonra tekrar deneyin.'
        : status === 401
          ? 'Ticketmaster API anahtarı geçersiz. Lütfen anahtarınızı kontrol edin.'
          : detail || 'Etkinlik verileri alınırken bir hata oluştu.'
    })
  }
}
