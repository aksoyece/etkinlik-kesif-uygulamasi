<script setup lang="ts">
import type { EventDetail } from '#shared/types/event'

const props = defineProps<{
  event: EventDetail
}>()

/** Bu bileşen yalnızca sayfa boyandıktan sonra mount edilir; burada hemen yükle */
const { similar, pending, visible, refresh, error } = useSimilarEvents(
  () => props.event,
  { enabled: true }
)
</script>

<template>
  <section
    v-if="visible"
    class="space-y-5 pt-4"
  >
    <div class="space-y-1">
      <p class="font-ticket text-xs text-neutral-400 dark:text-neutral-500 tracking-widest">
        Keşfetmeye devam
      </p>
      <h2 class="font-ticket text-2xl text-[#1A1A1A] dark:text-[#F7F5F0]">
        Bunları da sevebilirsin
      </h2>
      <p class="text-sm text-neutral-500 dark:text-neutral-400">
        Aynı türdeki yaklaşan etkinliklerden seçtik.
      </p>
    </div>

    <div
      v-if="pending"
      class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div
        v-for="n in 4"
        :key="n"
        class="ticket-stub flex-col h-64 animate-pulse"
      >
        <div class="aspect-[16/10] w-full bg-neutral-200 dark:bg-neutral-800" />
        <div class="p-4 space-y-2">
          <USkeleton class="h-3 w-1/3" />
          <USkeleton class="h-4 w-3/4" />
          <USkeleton class="h-3 w-1/2" />
        </div>
      </div>
    </div>

    <div
      v-else-if="error"
      class="ticket-stub flex-col items-center text-center p-6 gap-3"
    >
      <p class="text-sm text-neutral-500">
        Benzer etkinlikler yüklenemedi.
      </p>
      <UButton
        color="primary"
        size="sm"
        icon="i-lucide-refresh-cw"
        @click="refresh()"
      >
        Tekrar dene
      </UButton>
    </div>

    <div
      v-else
      class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
    >
      <FeaturedEventCard
        v-for="item in similar"
        :key="item.id"
        :event="item"
      />
    </div>
  </section>
</template>
