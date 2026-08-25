<script setup lang="ts">
import { parseDate } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
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

type DateRange = { start: DateValue, end: DateValue }

function parseSafe(value: string): DateValue | null {
  if (!value) {
    return null
  }
  try {
    return parseDate(value)
  } catch {
    return null
  }
}

const dateRange = computed<DateRange | null>({
  get: () => {
    const start = parseSafe(state.value.startDate)
    const end = parseSafe(state.value.endDate) || start
    if (!start || !end) {
      return null
    }
    return { start, end }
  },
  set: (val) => {
    state.value.startDate = val?.start ? val.start.toString() : ''
    state.value.endDate = val?.end ? val.end.toString() : ''
  }
})

const months = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
]

function formatCalendarDate(date: DateValue) {
  return `${date.day} ${months[date.month - 1]} ${date.year}`
}

const dateRangeLabel = computed(() => {
  if (!dateRange.value) {
    return 'Tarih seçin'
  }
  const { start, end } = dateRange.value
  if (start.toString() === end.toString()) {
    return formatCalendarDate(start)
  }
  return `${formatCalendarDate(start)} – ${formatCalendarDate(end)}`
})

function clearDateRange() {
  dateRange.value = null
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
      <UPopover class="w-full">
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
              v-if="dateRange"
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
          <UCalendar
            v-model="dateRange"
            range
            :number-of-months="1"
            class="p-2"
          />
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
