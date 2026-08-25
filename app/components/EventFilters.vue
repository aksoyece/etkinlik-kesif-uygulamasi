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

// 5. Loading State: Filtre yüklenirken Filtrele butonuna spinner eklemek için pending prop'u alındı
defineProps<{
  pending?: boolean
}>()

defineEmits<{
  reset: []
}>()

const { items: categoryItems, pending: classificationsPending } = useClassifications()

const cityItems = CITY_OPTIONS.map(o => ({ label: o.label, value: o.value as string }))
const sortItems = SORT_OPTIONS.map(o => ({ label: o.label, value: o.value as string }))

// 2. Tarih Seçici (Date Input): String (YYYY-MM-DD) formatını Nuxt UI'ın beklediği CalendarDate objesine dönüştüren computed yapılar
const startDateValue = computed({
  get: () => {
    if (!state.value.startDate) return null
    try {
      return parseDate(state.value.startDate)
    } catch {
      return null
    }
  },
  set: (val) => {
    state.value.startDate = val ? val.toString() : ''
  }
})

const endDateValue = computed({
  get: () => {
    if (!state.value.endDate) return null
    try {
      return parseDate(state.value.endDate)
    } catch {
      return null
    }
  },
  set: (val) => {
    state.value.endDate = val ? val.toString() : ''
  }
})

const formatCalendarDate = (date: DateValue | null) => {
  if (!date) return 'Seçiniz'
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ]
  return `${date.day} ${months[date.month - 1]} ${date.year}`
}
</script>

<template>
  <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
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
      label="Başlangıç tarihi"
    >
      <!-- 2. Tarih Seçici: Segmentli karmaşık girdi yerine Popover + UCalendar ile premium bir deneyim sunuldu -->
      <UPopover class="w-full">
        <UButton
          color="neutral"
          variant="outline"
          class="w-full justify-between text-left font-normal"
        >
          <span class="flex items-center gap-2 truncate">
            <UIcon
              name="i-lucide-calendar"
              class="size-4 opacity-50 flex-none"
            />
            <span class="truncate">{{ startDateValue ? formatCalendarDate(startDateValue) : 'Seçiniz' }}</span>
          </span>
          <div class="flex items-center gap-1 flex-none">
            <UButton
              v-if="startDateValue"
              icon="i-lucide-x"
              size="xs"
              color="neutral"
              variant="ghost"
              class="rounded-full p-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              @click.stop="startDateValue = null"
            />
            <UIcon
              name="i-lucide-chevron-down"
              class="size-4 opacity-50"
            />
          </div>
        </UButton>

        <template #content>
          <UCalendar
            v-model="startDateValue"
            class="p-2"
          />
        </template>
      </UPopover>
    </UFormField>

    <UFormField
      name="endDate"
      label="Bitiş tarihi"
    >
      <!-- 2. Tarih Seçici: Segmentli karmaşık girdi yerine Popover + UCalendar ile premium bir deneyim sunuldu -->
      <UPopover class="w-full">
        <UButton
          color="neutral"
          variant="outline"
          class="w-full justify-between text-left font-normal"
        >
          <span class="flex items-center gap-2 truncate">
            <UIcon
              name="i-lucide-calendar"
              class="size-4 opacity-50 flex-none"
            />
            <span class="truncate">{{ endDateValue ? formatCalendarDate(endDateValue) : 'Seçiniz' }}</span>
          </span>
          <div class="flex items-center gap-1 flex-none">
            <UButton
              v-if="endDateValue"
              icon="i-lucide-x"
              size="xs"
              color="neutral"
              variant="ghost"
              class="rounded-full p-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              @click.stop="endDateValue = null"
            />
            <UIcon
              name="i-lucide-chevron-down"
              class="size-4 opacity-50"
            />
          </div>
        </UButton>

        <template #content>
          <UCalendar
            v-model="endDateValue"
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
      <!-- 5. Loading State: Filtre yüklenirken butonda spinner gösterilir -->
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
