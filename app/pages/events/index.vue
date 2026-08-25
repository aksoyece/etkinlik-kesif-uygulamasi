<script setup lang="ts">
const {
  state,
  schema,
  page,
  events,
  pending,
  empty,
  total,
  errorMessage,
  refresh,
  onSubmit,
  reset,
  onPageChange
} = useEventExplorer()

useSeoMeta({
  title: 'Etkinlikler',
  description: 'Tüm yaklaşan etkinlikleri arayın, filtreleyin ve sıralayın.'
})
</script>

<template>
  <UContainer class="py-8 sm:py-12">
    <div class="mb-8 space-y-2">
      <!-- 1. RENK PALETİ: Kırmızı accent kuralına uymak için burası nötr yapıldı -->
      <p class="font-ticket text-xs text-neutral-400 dark:text-neutral-500">All events</p>
      <h1 class="font-ticket text-3xl text-[#1A1A1A] dark:text-[#F7F5F0]">
        Etkinlikler
      </h1>
      <p class="text-neutral-500 dark:text-neutral-400">
        Ticketmaster üzerindeki yaklaşan etkinlikleri keşfedin.
      </p>
    </div>

    <!-- 4. SPACING: Section dikey boşluğu space-y-8'e çıkarıldı -->
    <section class="space-y-8">
      <UForm
        :schema="schema"
        :state="state"
        <!-- 4. SPACING: Form padding'i p-5 sm:p-7 yapıldı -->
        class="ticket-stub flex-col space-y-4 p-5 sm:p-7"
        @submit="onSubmit"
      >
        <EventSearch
          v-model="state.keyword"
          @submit="onSubmit"
        />
        <EventFilters
          v-model="state"
          @reset="reset"
        />
      </UForm>

      <EventList
        :events="events"
        :pending="pending"
        :error="errorMessage"
        :empty="empty"
        :total="total"
        :page="page"
        @update:page="onPageChange"
        @retry="refresh"
      />
    </section>
  </UContainer>
</template>
