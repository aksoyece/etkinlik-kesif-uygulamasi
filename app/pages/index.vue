<script setup lang="ts">
import { CITY_OPTIONS } from '#shared/utils/filters'
import { pickDistinctFeatured } from '#shared/utils/featured'
import { formatUiNumber } from '#shared/utils/labels'
import { ACTIVE_MARKET } from '#shared/utils/market'
import { readLastCity, writeLastCity } from '#shared/utils/event'

useSeoMeta({
  title: 'Evently',
  description: 'Evently ile Birleşik Krallık’taki konser, spor ve sanat etkinliklerini keşfedin.',
  ogTitle: 'Evently',
  ogDescription: 'Ticketmaster UK pazarındaki yaklaşan etkinlikleri keşfet. Admit One bilet konsepti.',
  twitterCard: 'summary_large_image'
})

const router = useRouter()
const favorites = useFavoritesStore()
const keyword = ref('')

const discoverCategories = [
  { label: 'Müzik', value: 'Music', icon: 'i-lucide-music' },
  { label: 'Spor', value: 'Sports', icon: 'i-lucide-trophy' },
  { label: 'Tiyatro', value: 'Arts & Theatre', icon: 'i-lucide-drama' },
  { label: 'Aile', value: 'Family', icon: 'i-lucide-users' }
]

const popularCities = ACTIVE_MARKET.popularCities

function endOfWeekIso() {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date.toISOString().slice(0, 10)
}

function cityLabel(value: string | null) {
  if (!value) return null
  return CITY_OPTIONS.find(option => option.value === value)?.label ?? value
}

function formatWeekCount(total: number) {
  if (total >= 1000) return `${formatUiNumber(1000)}+`
  return formatUiNumber(total)
}

const { events: featuredPool, pending: featuredPending, error: featuredError, refresh: refreshFeatured } = useEvents({
  sort: 'relevance,desc',
  size: 20,
  page: 1
})

const featuredEvents = computed(() => pickDistinctFeatured(featuredPool.value, 3))

const { total: weekTotal, pending: weekPending } = useEvents({
  sort: 'date,asc',
  size: 1,
  page: 1,
  endDate: endOfWeekIso()
})

const lastCity = ref<string | null>(null)

onMounted(() => {
  favorites.init()
  lastCity.value = readLastCity()
})

function exploreSearch() {
  const q = keyword.value.trim()
  router.push({
    path: '/events',
    query: q ? { keyword: q } : {}
  })
}

function goCategory(value: string) {
  router.push({
    path: '/events',
    query: { category: value }
  })
}

function goCity(value: string) {
  writeLastCity(value)
  lastCity.value = value
  router.push({
    path: '/events',
    query: { city: value }
  })
}

function scrollToSpotlight() {
  document.getElementById('spotlight')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const passStats = computed(() => [
  {
    icon: 'i-lucide-heart',
    text: favorites.count > 0
      ? `${favorites.count} favori etkinliğin var`
      : 'Henüz favori eklemedin'
  },
  {
    icon: 'i-lucide-map-pin',
    text: lastCity.value
      ? `Son baktığın şehir: ${cityLabel(lastCity.value)}`
      : 'Henüz şehir seçmedin'
  },
  {
    icon: 'i-lucide-ticket',
    text: weekPending.value
      ? 'Bu hafta etkinlikler yükleniyor…'
      : `Bu hafta ${formatWeekCount(weekTotal.value || 0)} etkinlik`
  }
])
</script>

<template>
  <UContainer class="py-8 sm:py-12 space-y-14 sm:space-y-16">
    <!-- Hero -->
    <section class="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
      <div class="space-y-6">
        <div class="space-y-3">
          <span class="font-ticket inline-flex w-fit rounded-full bg-neutral-200 dark:bg-neutral-800 px-2.5 py-1 text-[9px] text-neutral-600 dark:text-neutral-300 tracking-widest">
            ADMIT ONE • KEŞFET
          </span>
          <h1 class="font-ticket text-4xl leading-tight text-[#1A1A1A] sm:text-5xl dark:text-[#F7F5F0]">
            Yaklaşan etkinlikleri keşfet
          </h1>
        </div>
        <p class="max-w-2xl text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Konser, spor, tiyatro ve daha fazlasını keşfet; öne çıkanlara ve popüler şehirlere göz at.
        </p>
        <div class="flex flex-wrap gap-3">
          <UButton
            color="primary"
            variant="solid"
            icon="i-lucide-sparkles"
            size="lg"
            class="transition-transform duration-200 hover:scale-105 active:scale-95 hover:brightness-110"
            @click="scrollToSpotlight"
          >
            Öne çıkanlara göz at
          </UButton>
          <UButton
            to="/favorites"
            color="neutral"
            variant="outline"
            icon="i-lucide-heart"
            size="lg"
            class="transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            Favorilerim
          </UButton>
        </div>
      </div>

      <!-- Evently Pass -->
      <div class="ticket-stub flex-col p-6 sm:p-7 gap-4">
        <div class="space-y-1">
          <p
            lang="en"
            class="font-ticket ticket-eyebrow text-[10px] text-neutral-400 dark:text-neutral-500"
          >
            ADMIT ONE
          </p>
          <p class="font-ticket text-sm font-semibold text-neutral-900 dark:text-white">
            Evently Kartı
          </p>
        </div>

        <ul class="space-y-3">
          <li
            v-for="stat in passStats"
            :key="stat.text"
            class="flex items-start gap-2.5 text-sm text-neutral-600 dark:text-neutral-300"
          >
            <UIcon
              :name="stat.icon"
              class="size-4 mt-0.5 text-[#E8432E] flex-none"
            />
            <span>{{ stat.text }}</span>
          </li>
        </ul>

        <div class="ticket-barcode mt-2 opacity-50" />
      </div>
    </section>

    <!-- Sade arama -->
    <section class="ticket-stub flex-col p-5 sm:p-7 gap-4">
      <p class="font-ticket text-xs text-neutral-400 dark:text-neutral-500">
        Hızlı arama
      </p>
      <div class="flex flex-col sm:flex-row gap-3">
        <UInput
          v-model="keyword"
          icon="i-lucide-search"
          size="lg"
          placeholder="Sanatçı, etkinlik veya mekan adı"
          class="w-full flex-1"
          @keydown.enter.prevent="exploreSearch"
        />
        <UButton
          color="primary"
          size="lg"
          icon="i-lucide-compass"
          class="sm:flex-none hover:brightness-110"
          @click="exploreSearch"
        >
          Keşfet
        </UButton>
      </div>
    </section>

    <!-- Bu Hafta Öne Çıkanlar -->
    <section
      id="spotlight"
      class="scroll-mt-24 space-y-6"
    >
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div class="space-y-1">
          <p class="font-ticket text-xs text-neutral-400 dark:text-neutral-500 tracking-widest">
            Öne çıkan
          </p>
          <h2 class="font-ticket text-2xl text-[#1A1A1A] dark:text-[#F7F5F0]">
            Öne çıkan etkinlikler
          </h2>
        </div>
        <UButton
          to="/events"
          color="neutral"
          variant="link"
          trailing-icon="i-lucide-arrow-right"
          class="px-0"
        >
          Tüm etkinlikleri gör
        </UButton>
      </div>

      <div
        v-if="featuredPending"
        class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div
          v-for="n in 3"
          :key="n"
          class="ticket-stub flex-col h-72 animate-pulse"
        >
          <div class="aspect-[16/10] w-full bg-neutral-200 dark:bg-neutral-800" />
          <div class="p-5 space-y-3">
            <USkeleton class="h-4 w-1/3" />
            <USkeleton class="h-5 w-3/4" />
            <USkeleton class="h-3 w-1/2" />
          </div>
        </div>
      </div>

      <div
        v-else-if="featuredError"
        class="ticket-stub flex-col items-center text-center p-8 gap-4"
      >
        <p class="text-sm text-neutral-500">
          Öne çıkanlar yüklenemedi.
        </p>
        <UButton
          color="primary"
          icon="i-lucide-refresh-cw"
          @click="refreshFeatured()"
        >
          Tekrar dene
        </UButton>
      </div>

      <div
        v-else
        class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <FeaturedEventCard
          v-for="event in featuredEvents"
          :key="event.id"
          :event="event"
        />
      </div>
    </section>

    <!-- Kategoriler -->
    <section class="space-y-5">
      <div class="space-y-1">
        <p class="font-ticket text-xs text-neutral-400 dark:text-neutral-500 tracking-widest">
          Göz at
        </p>
        <h2 class="font-ticket text-2xl text-[#1A1A1A] dark:text-[#F7F5F0]">
          Kategorilere göz at
        </h2>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          Neye göre keşfetmek istersin?
        </p>
      </div>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          v-for="item in discoverCategories"
          :key="item.value"
          type="button"
          class="ticket-stub flex-col items-center justify-center gap-2 p-5 text-center hover:border-[#E8432E] transition-all duration-200"
          @click="goCategory(item.value)"
        >
          <UIcon
            :name="item.icon"
            class="size-6 text-[#E8432E]"
          />
          <span class="font-ticket text-sm font-semibold text-neutral-900 dark:text-white">
            {{ item.label }}
          </span>
        </button>
      </div>
    </section>

    <!-- Popüler şehirler -->
    <section class="space-y-5">
      <div class="space-y-1">
        <p class="font-ticket text-xs text-neutral-400 dark:text-neutral-500 tracking-widest">
          Şehirler
        </p>
        <h2 class="font-ticket text-2xl text-[#1A1A1A] dark:text-[#F7F5F0]">
          Popüler şehirler
        </h2>
      </div>
      <div class="flex flex-wrap gap-3">
        <button
          v-for="city in popularCities"
          :key="city.value"
          type="button"
          class="ticket-stub inline-flex items-center gap-2.5 px-5 py-3.5 hover:border-[#E8432E] transition-all duration-200"
          @click="goCity(city.value)"
        >
          <UIcon
            name="i-lucide-map-pin"
            class="size-4 text-[#E8432E]"
          />
          <span class="font-ticket text-sm font-semibold text-neutral-900 dark:text-white">
            {{ city.label }}
          </span>
        </button>
      </div>
    </section>

    <!-- Alt CTA -->
    <section class="ticket-stub flex-col sm:flex-row items-center justify-between gap-4 p-6 sm:p-8">
      <div class="space-y-1 text-center sm:text-left">
        <p class="font-ticket text-xs text-neutral-400 dark:text-neutral-500 tracking-widest">
          Katalog
        </p>
        <h2 class="font-ticket text-xl text-neutral-900 dark:text-white">
          Tüm etkinlikleri keşfet
        </h2>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          Filtrele, sırala ve favorilerine kaydet.
        </p>
      </div>
      <UButton
        to="/events"
        color="primary"
        size="lg"
        trailing-icon="i-lucide-arrow-right"
        class="hover:brightness-110"
      >
        Etkinliklere git
      </UButton>
    </section>
  </UContainer>
</template>
