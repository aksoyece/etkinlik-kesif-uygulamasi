<script setup lang="ts">
import type { EventSummary } from '#shared/types/event'

const props = defineProps<{
  event: EventSummary
}>()

const categoryLabel = computed(() => {
  const cat = props.event.category
  if (!cat || cat.toUpperCase() === 'UNDEFINED') return 'Genel'
  const upper = cat.toUpperCase()
  if (upper.includes('MUSIC')) return 'Müzik'
  if (upper.includes('SPORTS')) return 'Spor'
  if (upper.includes('ARTS') || upper.includes('THEATRE')) return 'Sanat & Tiyatro'
  if (upper.includes('FAMILY')) return 'Aile'
  if (upper.includes('FILM')) return 'Film'
  if (upper.includes('MISCELLANEOUS')) return 'Diğer'
  return cat
})

const categoryBadgeClass = computed(() => {
  const cat = (props.event.category || '').toUpperCase()
  if (cat.includes('MUSIC')) return 'bg-amber-500 text-white'
  if (cat.includes('SPORTS')) return 'bg-blue-600 text-white'
  if (cat.includes('ARTS') || cat.includes('THEATRE')) return 'bg-purple-600 text-white'
  if (cat.includes('FAMILY')) return 'bg-emerald-600 text-white'
  if (cat.includes('FILM')) return 'bg-[#E8432E] text-white'
  return 'bg-neutral-500 text-white'
})
</script>

<template>
  <NuxtLink
    :to="`/events/${event.id}`"
    class="ticket-stub group flex-col h-full overflow-hidden"
  >
    <div class="relative aspect-[16/10] w-full overflow-hidden flex-none">
      <img
        :src="event.image || '/placeholder-event.svg'"
        :alt="event.name"
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        decoding="async"
      >
      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <span
        class="font-ticket absolute bottom-3 left-3 rounded px-2 py-0.5 text-[9px] font-bold shadow-sm"
        :class="categoryBadgeClass"
      >
        {{ categoryLabel }}
      </span>
    </div>

    <div class="ticket-tear-horizontal" />

    <div class="flex flex-1 flex-col gap-3 p-5 sm:p-6">
      <p
        lang="en"
        class="font-ticket ticket-eyebrow text-[10px] text-neutral-400 dark:text-neutral-500"
      >
        ADMIT ONE
      </p>
      <h3 class="font-ticket text-base sm:text-lg font-bold leading-snug text-[#1A1A1A] dark:text-[#F7F5F0] line-clamp-2 group-hover:text-[#E8432E] transition-colors">
        {{ event.name }}
      </h3>
      <div class="mt-auto space-y-1 font-ticket text-xs text-neutral-500 dark:text-neutral-400">
        <p class="truncate">{{ event.dateLabel || 'Tarih açıklanacak' }}</p>
        <p class="truncate">{{ [event.venue, event.city].filter(Boolean).join(' · ') || 'Mekan açıklanacak' }}</p>
      </div>
    </div>
  </NuxtLink>
</template>
