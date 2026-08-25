import type { ClassificationOption } from '#shared/types/event'
import { ALL_FILTER_VALUE, DEFAULT_CATEGORY_OPTIONS } from '#shared/utils/filters'

export function useClassifications() {
  const { data, pending, error } = useAsyncData(
    'classifications',
    () => $fetch<ClassificationOption[]>('/api/classifications'),
    {
      default: () => []
    }
  )

  const items = computed(() => {
    const fetched = (data.value ?? []).map(item => ({
      label: translateCategory(item.name),
      value: item.name
    }))

    if (!fetched.length) {
      return DEFAULT_CATEGORY_OPTIONS
    }

    return [
      { label: 'Tüm kategoriler', value: ALL_FILTER_VALUE },
      ...fetched
    ]
  })

  return {
    classifications: data,
    items,
    pending,
    error
  }
}

function translateCategory(name: string): string {
  const labels: Record<string, string> = {
    Music: 'Müzik',
    Sports: 'Spor',
    'Arts & Theatre': 'Sanat ve Tiyatro',
    Film: 'Film',
    Miscellaneous: 'Diğer',
    Undefined: 'Diğer'
  }

  return labels[name] || name
}
