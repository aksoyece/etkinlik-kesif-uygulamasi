import type { ClassificationOption } from '#shared/types/event'
import { ALL_FILTER_VALUE, DEFAULT_CATEGORY_OPTIONS } from '#shared/utils/filters'
import { translateCategory } from '#shared/utils/labels'

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
