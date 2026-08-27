<script setup lang="ts">
import type { EventSummary } from '#shared/types/event'
import { translateCategory } from '#shared/utils/labels'

const props = defineProps<{
  event: EventSummary
}>()

const categoryLabel = computed(() => translateCategory(props.event.category))

const categoryBadgeClass = computed(() => {
  const cat = (props.event.category || '').toUpperCase()
  if (cat.includes('MUSIC')) return 'bg-amber-500 text-white'
  if (cat.includes('SPORTS')) return 'bg-blue-600 text-white'
  if (cat.includes('ARTS') || cat.includes('THEATRE') || cat.includes('THEATER')) return 'bg-purple-600 text-white'
  if (cat.includes('FAMILY')) return 'bg-emerald-600 text-white'
  if (cat.includes('FILM')) return 'bg-[#E8432E] text-white'
  return 'bg-neutral-500 text-white'
})

const { seedFromSummary } = useEventPreview()

function warmDetail() {
  seedFromSummary(props.event)
  prefetchEventDetail(props.event.id)
}
</script>

<template>
  <NuxtLink
    :to="`/events/${event.id}`"
    prefetch
    class="ticket-stub group flex-col h-full overflow-hidden"
    @pointerdown="warmDetail"
  >
    <div class="relative aspect-[16/10] w-full overflow-hidden flex-none">
      <EventCoverImage
        :src="event.image"
        :alt="event.name"
        mode="card"
      />
      <div class="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <span
        class="font-ticket absolute bottom-3 left-3 z-[3] rounded px-2 py-0.5 text-[9px] font-bold shadow-sm"
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
      <p class="font-ticket text-xs text-neutral-500 dark:text-neutral-400">
        {{ event.dateLabel }}
        <span v-if="event.city"> · {{ event.city }}</span>
      </p>
    </div>
  </NuxtLink>
</template>
