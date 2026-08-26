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
      <p class="font-ticket text-xs text-neutral-400 dark:text-neutral-500">
        All events • Evently
      </p>
      <h1 class="font-ticket text-3xl text-[#1A1A1A] dark:text-[#F7F5F0]">
        Etkinlikler
      </h1>
      <p class="text-neutral-500 dark:text-neutral-400">
        Birleşik Krallık’taki yaklaşan etkinlikleri keşfedin.
      </p>
    </div>

    <section class="space-y-8">
      <UForm
        :schema="schema"
        :state="state"
        class="ticket-stub flex-col space-y-4 p-5 sm:p-7"
        @submit="onSubmit"
      >
        <EventSearch
          v-model="state.keyword"
          @submit="onSubmit"
        />
        <!-- 5. Loading State: Filtre yüklenirken butona spinner eklemek için pending prop'u geçildi -->
        <EventFilters
          v-model="state"
          :pending="pending"
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
