<script setup lang="ts">
import type { EventSummary, FavoriteEvent } from '#shared/types/event'
import { toFavoriteEvent } from '#shared/utils/event'
import { resolveEventTypeKey, resolveEventTypeLabel } from '#shared/utils/labels'

const props = defineProps<{
  event: EventSummary | FavoriteEvent
}>()

const favorites = useFavoritesStore()
const toast = useToast()

const favorited = computed(() => favorites.isFavorite(props.event.id))
const isHeartAnimating = ref(false)

const genre = computed(() => ('genre' in props.event ? props.event.genre : undefined))
const typeLabel = computed(() => resolveEventTypeLabel(props.event.category, genre.value))
const typeKey = computed(() => resolveEventTypeKey(props.event.category, genre.value))

const when = computed(() => props.event.dateLabel || 'Tarih açıklanacak')
const venueName = computed(() => props.event.venue || 'Mekan açıklanacak')
const cityName = computed(() => props.event.city || 'Şehir açıklanacak')
const price = computed(() => props.event.priceLabel || 'Fiyat Ticketmaster’da görüntülenir')

const categoryBadgeClass = computed(() => {
  const cat = typeKey.value.toUpperCase()
  if (cat.includes('MUSIC')) return 'bg-amber-500 text-white'
  if (cat.includes('SPORTS') || cat.includes('FOOTBALL') || cat.includes('SOCCER')) return 'bg-blue-600 text-white'
  if (cat.includes('ARTS') || cat.includes('THEATRE') || cat.includes('THEATER')) return 'bg-purple-600 text-white'
  if (cat.includes('FAMILY') || cat.includes('CHILDREN')) return 'bg-emerald-600 text-white'
  if (cat.includes('FILM')) return 'bg-[#E8432E] text-white'
  return 'bg-neutral-500 text-white'
})

const barcodeStyle = computed(() => {
  const id = props.event.id || 'default'
  let seed = 0
  for (let i = 0; i < id.length; i++) {
    seed = id.charCodeAt(i) + ((seed << 5) - seed)
  }

  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }

  const lines: string[] = []
  let currentPos = 0
  const numLines = 25 + Math.floor(random() * 10)
  for (let i = 0; i < numLines; i++) {
    const lineWidth = Math.floor(random() * 3) + 1
    const spaceWidth = Math.floor(random() * 4) + 1
    currentPos += lineWidth
    lines.push(`currentColor ${currentPos - lineWidth}px ${currentPos}px`)
    currentPos += spaceWidth
    lines.push(`transparent ${currentPos - spaceWidth}px ${currentPos}px`)
  }

  return {
    backgroundImage: `repeating-linear-gradient(90deg, ${lines.join(', ')})`
  }
})

function toggleFavorite() {
  isHeartAnimating.value = true
  setTimeout(() => {
    isHeartAnimating.value = false
  }, 350)

  const added = favorites.toggle(toFavoriteEvent(props.event as EventSummary))
  toast.add({
    title: added ? 'Favorilere eklendi' : 'Favorilerden çıkarıldı',
    description: props.event.name,
    color: added ? 'success' : 'neutral',
    icon: added ? 'i-lucide-heart' : 'i-lucide-heart-off'
  })
}

const { seedFromSummary } = useEventPreview()

function onNavigateIntent() {
  seedFromSummary(props.event as EventSummary)
  prefetchEventDetail(props.event.id)
}
</script>

<template>
  <article class="ticket-stub group relative flex-col sm:flex-row h-full">
    <NuxtLink
      :to="`/events/${event.id}`"
      prefetch
      class="flex flex-col sm:flex-row flex-1 min-w-0 h-full text-inherit no-underline"
      @pointerdown="onNavigateIntent"
    >
      <div class="relative block w-full sm:w-[40%] aspect-[4/3] overflow-hidden flex-none">
        <EventCoverImage
          :src="event.image"
          :alt="event.name"
          mode="card"
        />
        <div class="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        <span
          class="font-ticket absolute bottom-3 left-3 z-[3] rounded px-2 py-0.5 text-[9px] font-bold shadow-sm transition-colors duration-300"
          :class="categoryBadgeClass"
        >
          {{ typeLabel }}
        </span>
      </div>

      <div class="ticket-tear-horizontal block sm:hidden" />
      <div class="ticket-tear-vertical hidden sm:block" />

      <div class="flex flex-1 flex-col gap-4 p-6 sm:p-7 min-w-0">
        <div class="flex items-start justify-between gap-3 pr-10">
          <h3 class="font-ticket line-clamp-2 text-lg font-bold leading-snug text-[#1A1A1A] group-hover:text-[#E8432E] dark:text-[#F7F5F0] dark:group-hover:text-[#E8432E] transition-colors duration-200">
            {{ event.name }}
          </h3>
        </div>

        <dl class="font-ticket grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <dt class="text-xs font-bold tracking-widest text-neutral-500 dark:text-neutral-400 opacity-60 uppercase">
              Tarih
            </dt>
            <dd class="ticket-line text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
              {{ when }}
            </dd>
          </div>
          <div>
            <dt class="text-xs font-bold tracking-widest text-neutral-500 dark:text-neutral-400 opacity-60 uppercase">
              Tür
            </dt>
            <dd class="ticket-line text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5 truncate">
              {{ typeLabel }}
            </dd>
          </div>
          <div class="col-span-2">
            <dt class="text-xs font-bold tracking-widest text-neutral-500 dark:text-neutral-400 opacity-60 uppercase">
              Mekan
            </dt>
            <dd class="ticket-line text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5 truncate">
              {{ venueName }}
            </dd>
          </div>
          <div>
            <dt class="text-xs font-bold tracking-widest text-neutral-500 dark:text-neutral-400 opacity-60 uppercase">
              Şehir
            </dt>
            <dd class="ticket-line text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5 truncate">
              {{ cityName }}
            </dd>
          </div>
          <div>
            <dt class="text-xs font-bold tracking-widest text-neutral-500 dark:text-neutral-400 opacity-60 uppercase">
              Fiyat
            </dt>
            <dd class="ticket-line text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5 truncate">
              {{ price }}
            </dd>
          </div>
        </dl>

        <p
          lang="en"
          class="font-ticket ticket-eyebrow text-[9px] text-neutral-400 dark:text-neutral-500"
        >
          ADMIT ONE
        </p>
        <div
          class="ticket-barcode mt-auto pt-2"
          :style="barcodeStyle"
        />
      </div>
    </NuxtLink>

    <ClientOnly>
      <UButton
        square
        size="xs"
        :color="favorited ? 'primary' : 'neutral'"
        :variant="favorited ? 'solid' : 'ghost'"
        icon="i-lucide-heart"
        class="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 transition-transform duration-200 hover:scale-110 active:scale-95 flex-none"
        :class="{ 'animate-heart-bounce': isHeartAnimating }"
        :aria-label="favorited ? 'Favorilerden çıkar' : 'Favorilere ekle'"
        @click.prevent.stop="toggleFavorite"
      />
    </ClientOnly>
  </article>
</template>
