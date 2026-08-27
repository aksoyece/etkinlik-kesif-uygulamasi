<script setup lang="ts">
import type { PopularArtist } from '#shared/types/event'
import { translateCategory, translateGenre } from '#shared/utils/labels'

const { artists, pending, empty, error, refresh } = usePopularArtists()

const scroller = ref<HTMLElement | null>(null)
const canScrollPrev = ref(false)
const canScrollNext = ref(false)

function artistLabel(artist: PopularArtist) {
  const genre = translateGenre(artist.label, { name: artist.name })
  if (genre && genre !== 'Genel') return genre
  return translateCategory(artist.label)
}

function updateScrollState() {
  const el = scroller.value
  if (!el) {
    canScrollPrev.value = false
    canScrollNext.value = false
    return
  }
  const max = el.scrollWidth - el.clientWidth
  canScrollPrev.value = el.scrollLeft > 4
  canScrollNext.value = el.scrollLeft < max - 4
}

function scrollByCard(direction: -1 | 1) {
  const el = scroller.value
  if (!el) return
  const amount = Math.max(220, Math.floor(el.clientWidth * 0.7))
  el.scrollBy({ left: direction * amount, behavior: 'smooth' })
}

onMounted(() => {
  updateScrollState()
  scroller.value?.addEventListener('scroll', updateScrollState, { passive: true })
  window.addEventListener('resize', updateScrollState)
})

onBeforeUnmount(() => {
  scroller.value?.removeEventListener('scroll', updateScrollState)
  window.removeEventListener('resize', updateScrollState)
})

watch(artists, async () => {
  await nextTick()
  updateScrollState()
})
</script>

<template>
  <section
    v-if="pending || (!empty && artists.length)"
    class="space-y-5"
  >
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div class="space-y-1">
        <p class="font-ticket text-xs text-neutral-400 dark:text-neutral-500 tracking-widest">
          Trend
        </p>
        <h2 class="font-ticket text-2xl text-[#1A1A1A] dark:text-[#F7F5F0]">
          Popüler isimler
        </h2>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          UK’deki yaklaşan etkinliklerden öne çıkan isimler.
        </p>
      </div>

      <div class="hidden sm:flex items-center gap-2">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-chevron-left"
          size="sm"
          :disabled="!canScrollPrev"
          aria-label="Önceki isimler"
          @click="scrollByCard(-1)"
        />
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-chevron-right"
          size="sm"
          :disabled="!canScrollNext"
          aria-label="Sonraki isimler"
          @click="scrollByCard(1)"
        />
      </div>
    </div>

    <div
      v-if="pending"
      class="flex gap-4 overflow-hidden"
    >
      <div
        v-for="n in 6"
        :key="n"
        class="ticket-stub w-40 sm:w-44 flex-none flex-col animate-pulse"
      >
        <div class="aspect-square w-full bg-neutral-200 dark:bg-neutral-800" />
        <div class="p-3 space-y-2">
          <USkeleton class="h-2.5 w-1/2" />
          <USkeleton class="h-4 w-3/4" />
        </div>
      </div>
    </div>

    <div
      v-else-if="error"
      class="ticket-stub flex-col items-center text-center p-6 gap-3"
    >
      <p class="text-sm text-neutral-500">
        Popüler isimler yüklenemedi.
      </p>
      <UButton
        color="primary"
        icon="i-lucide-refresh-cw"
        size="sm"
        @click="refresh()"
      >
        Tekrar dene
      </UButton>
    </div>

    <div
      v-else
      ref="scroller"
      class="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <NuxtLink
        v-for="artist in artists"
        :key="artist.id"
        :to="{ path: '/events', query: { keyword: artist.name } }"
        class="ticket-stub group w-40 sm:w-44 flex-none flex-col overflow-hidden snap-start"
      >
        <div class="relative aspect-square w-full overflow-hidden flex-none bg-neutral-200 dark:bg-neutral-800">
          <img
            :src="artist.image || '/placeholder-event.svg'"
            :alt="artist.name"
            class="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            @error="($event.target as HTMLImageElement).src = '/placeholder-event.svg'"
          >
          <div class="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        </div>
        <div class="ticket-tear-horizontal" />
        <div class="flex flex-1 flex-col gap-1.5 p-3">
          <p class="font-ticket text-[9px] tracking-widest text-neutral-400 dark:text-neutral-500 uppercase">
            {{ artistLabel(artist) }}
          </p>
          <h3 class="font-ticket text-sm font-bold leading-snug text-[#1A1A1A] dark:text-[#F7F5F0] line-clamp-2 group-hover:text-[#E8432E] transition-colors">
            {{ artist.name }}
          </h3>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>
