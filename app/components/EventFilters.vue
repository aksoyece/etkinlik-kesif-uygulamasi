<script setup lang="ts">
import { parseDate } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import type { DateRange } from 'reka-ui'
import { CITY_OPTIONS, SORT_OPTIONS } from '#shared/utils/filters'

const state = defineModel<{
  keyword: string
  city: string
  classificationName: string
  startDate: string
  endDate: string
  sort: string
}>({ required: true })

defineProps<{
  pending?: boolean
}>()

defineEmits<{
  reset: []
}>()

const { items: categoryItems, pending: classificationsPending } = useClassifications()

const cityItems = CITY_OPTIONS.map(o => ({ label: o.label, value: o.value as string }))
const sortItems = SORT_OPTIONS.map(o => ({ label: o.label, value: o.value as string }))

function parseSafe(value: string): DateValue | undefined {
  if (!value) {
    return undefined
  }
  try {
    return parseDate(value)
  } catch {
    return undefined
  }
}

/** Aralık seçimi: end ilk tıklamada undefined kalmalı (start===end yapılırsa 2. gün seçilemez) */
const dateRange = shallowRef<DateRange | null>(null)
const datePopoverOpen = ref(false)

watch(
  () => [state.value.startDate, state.value.endDate] as const,
  ([startStr, endStr]) => {
    const start = parseSafe(startStr)
    const end = parseSafe(endStr)
    const nextStart = dateRange.value?.start?.toString() ?? ''
    const nextEnd = dateRange.value?.end?.toString() ?? ''
    if (nextStart === (start?.toString() ?? '') && nextEnd === (end?.toString() ?? '')) {
      return
    }
    if (!start && !end) {
      dateRange.value = null
      return
    }
    dateRange.value = { start, end }
  },
  { immediate: true }
)

watch(dateRange, (val) => {
  const startStr = val?.start?.toString() ?? ''
  const endStr = val?.end?.toString() ?? ''
  if (state.value.startDate === startStr && state.value.endDate === endStr) {
    return
  }
  state.value.startDate = startStr
  state.value.endDate = endStr
})

const months = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
]

function formatCalendarDate(date: DateValue) {
  return `${date.day} ${months[date.month - 1]} ${date.year}`
}

const dateRangeLabel = computed(() => {
  const start = dateRange.value?.start
  const end = dateRange.value?.end
  if (!start) {
    return 'Başlangıç – bitiş seçin'
  }
  if (!end) {
    return `${formatCalendarDate(start)} – bitiş seçin`
  }
  if (start.toString() === end.toString()) {
    return formatCalendarDate(start)
  }
  return `${formatCalendarDate(start)} – ${formatCalendarDate(end)}`
})

function clearDateRange() {
  dateRange.value = null
  state.value.startDate = ''
  state.value.endDate = ''
}

function onRangeComplete(value: DateRange) {
  if (value.start && value.end) {
    dateRange.value = value
    datePopoverOpen.value = false
  }
}
</script>

<template>
  <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
    <UFormField
      name="city"
      label="Şehir"
    >
      <USelect
        v-model="state.city"
        :items="cityItems"
        placeholder="Şehir seçin"
        class="w-full"
      />
    </UFormField>

    <UFormField
      name="classificationName"
      label="Kategori"
    >
      <USelect
        v-model="state.classificationName"
        :items="categoryItems"
        :loading="classificationsPending"
        placeholder="Kategori seçin"
        class="w-full"
      />
    </UFormField>

    <UFormField
      name="startDate"
      label="Tarih aralığı"
    >
      <UPopover
        v-model:open="datePopoverOpen"
        class="w-full"
      >
        <UButton
          color="neutral"
          variant="outline"
          class="w-full justify-between text-left font-normal"
        >
          <span class="flex items-center gap-2 truncate">
            <UIcon
              name="i-lucide-calendar-range"
              class="size-4 opacity-50 flex-none"
            />
            <span class="truncate">{{ dateRangeLabel }}</span>
          </span>
          <div class="flex items-center gap-1 flex-none">
            <UButton
              v-if="dateRange?.start"
              icon="i-lucide-x"
              size="xs"
              color="neutral"
              variant="ghost"
              class="rounded-full p-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              @click.stop="clearDateRange"
            />
            <UIcon
              name="i-lucide-chevron-down"
              class="size-4 opacity-50"
            />
          </div>
        </UButton>

        <template #content>
          <div class="w-[min(100vw-1.5rem,20.5rem)] p-3">
            <p class="mb-2 px-1 text-xs text-neutral-500 dark:text-neutral-400">
              Önce başlangıç, sonra bitiş gününü seçin.
            </p>
            <UCalendar
              v-model="dateRange"
              range
              locale="tr-TR"
              :number-of-months="1"
              class="w-full"
              @update:valid-model-value="onRangeComplete"
            />
          </div>
        </template>
      </UPopover>
    </UFormField>

    <UFormField
      name="sort"
      label="Sıralama"
    >
      <USelect
        v-model="state.sort"
        :items="sortItems"
        class="w-full"
      />
    </UFormField>

    <div class="flex items-end gap-2">
      <UButton
        type="submit"
        icon="i-lucide-filter"
        block
        :loading="pending"
        class="flex-1 hover:brightness-110 transition-all duration-200"
      >
        Filtrele
      </UButton>
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide-rotate-ccw"
        aria-label="Filtreleri temizle"
        @click="$emit('reset')"
      />
    </div>
  </div>
</template>
