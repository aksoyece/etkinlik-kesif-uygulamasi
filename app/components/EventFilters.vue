<script setup lang="ts">
import { CITY_OPTIONS, SORT_OPTIONS } from '#shared/utils/filters'

const state = defineModel<{
  keyword: string
  city: string
  classificationName: string
  startDate: string
  endDate: string
  sort: string
}>({ required: true })

defineEmits<{
  reset: []
}>()

  const { items: categoryItems, pending: classificationsPending } = useClassifications()

const cityItems = [...CITY_OPTIONS]
const sortItems = [...SORT_OPTIONS]
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
      <UInput
        v-model="state.startDate"
        type="date"
        class="w-full"
      />
    </UFormField>

    <UFormField
      name="endDate"
      label="Bitiş tarihi"
    >
      <UInput
        v-model="state.endDate"
        type="date"
        class="w-full"
      />
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
