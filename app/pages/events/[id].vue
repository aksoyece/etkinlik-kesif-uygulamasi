<script setup lang="ts">
import { mapsUrl, toFavoriteEvent, uniqueGalleryImages } from '#shared/utils/event'
import { buildGoogleCalendarUrl, buildIcsContent } from '#shared/utils/calendar'
import { translateCategory, translateGenre, translateStatus } from '#shared/utils/labels'
import { isValidTicketUrl } from '#shared/utils/ticketUrl'

const route = useRoute()
const requestUrl = useRequestURL()
const toast = useToast()
const favorites = useFavoritesStore()

const id = computed(() => String(route.params.id || ''))
const { event, pending, error, refresh } = useEvent(id)

// Event payload’da venue yoksa (nadir) ekstra venue API; varsa gereksiz istek yok
const needsVenueFetch = computed(() =>
  Boolean(event.value?.venueId && !event.value?.venueDetail)
)
const { venue } = useVenue(
  computed(() => event.value?.venueId),
  { enabled: needsVenueFetch }
)

const favorited = computed(() => event.value ? favorites.isFavorite(event.value.id) : false)
/** Önizleme / liste verisinden de mekan adı hemen görünsün */
const venueInfo = computed(() => {
  if (event.value?.venueDetail) {
    return event.value.venueDetail
  }
  if (venue.value) {
    return venue.value
  }
  if (event.value?.venue) {
    return {
      name: event.value.venue,
      city: event.value.city,
      country: event.value.country,
      address: [event.value.city, event.value.country].filter(Boolean).join(', ') || undefined
    }
  }
  return undefined
})
const mapLink = computed(() => mapsUrl(venueInfo.value))
const galleryImages = computed(() => uniqueGalleryImages(event.value?.images ?? []))
const googleCalendarUrl = computed(() => event.value ? buildGoogleCalendarUrl(event.value) : undefined)
const pageUrl = computed(() => `${requestUrl.origin}${route.fullPath}`)

const categoryLabel = computed(() => translateCategory(event.value?.category))
const genreLabel = computed(() => translateGenre(event.value?.genre))
const statusText = computed(() => translateStatus(event.value?.status))
/** Sunucu localizeEventCopy / localizeVenueCopy ile çevirir — template ham TM metni kullanmaz */
const infoText = computed(() => event.value?.info || undefined)
const pleaseNoteText = computed(() => event.value?.pleaseNote || undefined)
const venueBoxOffice = computed(() => venueInfo.value?.boxOffice || undefined)
const venueBoxOfficePhone = computed(() => venueInfo.value?.boxOfficePhone || undefined)
const venueParking = computed(() => venueInfo.value?.parkingDetail || undefined)
const venueRules = computed(() => venueInfo.value?.generalRule || undefined)
const venueChildRule = computed(() => venueInfo.value?.childRule || undefined)
const venueAccessibility = computed(() => venueInfo.value?.accessibilityDetail || undefined)
const venueAddress = computed(() => venueInfo.value?.address)
const canBuyTicket = computed(() => isValidTicketUrl(event.value?.ticketUrl))

const selectedImage = ref<string | null>(null)
const galleryOpen = computed({
  get: () => Boolean(selectedImage.value),
  set: (open: boolean) => {
    if (!open) {
      selectedImage.value = null
    }
  }
})

/** Galeri / sanatçılar / mekan ekleri — ana bilet boyandıktan sonra */
const belowFoldReady = ref(false)
/** Öneri yalnızca viewport’a girince — açılışta ağ/CPU yok */
const similarVisible = ref(false)
const similarSentinel = ref<HTMLElement | null>(null)

onMounted(() => {
  const revealBelow = () => {
    belowFoldReady.value = true
  }
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(revealBelow, { timeout: 500 })
  } else {
    requestAnimationFrame(() => setTimeout(revealBelow, 50))
  }

  const el = similarSentinel.value
  if (!el || typeof IntersectionObserver === 'undefined') {
    // IO yoksa yine de hemen değil, uzun gecikmeyle
    setTimeout(() => {
      similarVisible.value = true
    }, 2500)
    return
  }

  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some(entry => entry.isIntersecting)) {
        similarVisible.value = true
        io.disconnect()
      }
    },
    { rootMargin: '160px 0px', threshold: 0.01 }
  )
  io.observe(el)
  onBeforeUnmount(() => io.disconnect())
})

// 9. 404 Sayfası: Olmayan bir etkinlik ID'sine gidildiğinde fatal 404 hatası fırlatır, böylece custom error.vue tetiklenir
watch(error, (newError) => {
  if (newError) {
    const err = newError as { statusCode?: number, status?: number }
    const statusCode = err.statusCode || err.status || 500
    if (statusCode === 404) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Etkinlik Bulunamadı',
        fatal: true
      })
    }
  }
}, { immediate: true })

useSeoMeta({
  title: 'Evently',
  description: () => event.value?.info || `${event.value?.name || 'Etkinlik'} — ${event.value?.dateLabel || ''}`.trim(),
  ogTitle: () => event.value?.name || 'Evently',
  ogDescription: () => event.value?.info || event.value?.name || 'Etkinlik detayı',
  ogImage: () => event.value?.image,
  ogUrl: () => pageUrl.value,
  twitterCard: 'summary_large_image',
  twitterTitle: () => event.value?.name || 'Evently',
  twitterDescription: () => event.value?.info || event.value?.name,
  twitterImage: () => event.value?.image
})

useHead(() => {
  if (!event.value) {
    return {}
  }

  const start = event.value.localDate
    ? `${event.value.localDate}T${event.value.localTime || '00:00:00'}`
    : undefined

  return {
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Event',
          'name': event.value.name,
          'startDate': start,
          'image': event.value.image,
          'url': pageUrl.value,
          'eventStatus': 'https://schema.org/EventScheduled',
          'location': venueInfo.value
            ? {
                '@type': 'Place',
                'name': venueInfo.value.name,
                'address': venueInfo.value.address
              }
            : undefined,
          'offers': canBuyTicket.value && event.value.ticketUrl
            ? {
                '@type': 'Offer',
                'url': event.value.ticketUrl,
                'availability': 'https://schema.org/InStock'
              }
            : undefined
        })
      }
    ]
  }
})

function downloadIcs() {
  if (!event.value) {
    return
  }

  const content = buildIcsContent(event.value)
  if (!content) {
    toast.add({ title: 'Takvim tarihi yok', color: 'warning' })
    return
  }

  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${event.value.name.replace(/[^\wğüşöçıİĞÜŞÖÇ\s-]+/gi, '').trim() || 'etkinlik'}.ics`
  link.click()
  URL.revokeObjectURL(link.href)
}

async function shareEvent() {
  const title = event.value?.name || 'Etkinlik'
  const url = pageUrl.value

  try {
    if (navigator.share) {
      await navigator.share({ title, text: event.value?.dateLabel, url })
      return
    }

    await navigator.clipboard.writeText(url)
    toast.add({ title: 'Bağlantı kopyalandı', color: 'success' })
  } catch (shareError) {
    if ((shareError as { name?: string }).name === 'AbortError') {
      return
    }
    toast.add({ title: 'Paylaşılamadı', color: 'error' })
  }
}

function toggleFavorite() {
  if (!event.value) {
    return
  }

  const added = favorites.toggle(toFavoriteEvent(event.value))
  toast.add({
    title: added ? 'Favorilere eklendi' : 'Favorilerden çıkarıldı',
    description: event.value.name,
    color: added ? 'success' : 'neutral'
  })
}

const categoryBadgeClass = computed(() => {
  if (!event.value) return 'bg-neutral-600 text-white'
  const cat = (event.value.category || '').toUpperCase()
  if (cat.includes('MUSIC')) return 'bg-amber-500 text-white' // Konser: Turuncu
  if (cat.includes('SPORTS')) return 'bg-blue-600 text-white' // Spor: Mavi
  if (cat.includes('ARTS') || cat.includes('THEATRE')) return 'bg-purple-600 text-white' // Tiyatro/Sanat: Mor
  if (cat.includes('FAMILY')) return 'bg-emerald-600 text-white' // Aile: Yeşil
  if (cat.includes('FILM')) return 'bg-[#E8432E] text-white' // Film: Kırmızı (En öne çıkan kategori)
  return 'bg-neutral-500 text-white' // Miscellaneous / Diğer: Gri
})

// 8. Barkod Deseni Çeşitliliği: Detay sayfasındaki bilet için de deterministik barkod üretilir
const barcodeStyle = computed(() => {
  const eventId = event.value?.id || 'default'
  let seed = 0
  for (let i = 0; i < eventId.length; i++) {
    seed = eventId.charCodeAt(i) + ((seed << 5) - seed)
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
</script>

<template>
  <UContainer class="py-8 sm:py-12">
    <UButton
      to="/events"
      color="neutral"
      variant="ghost"
      icon="i-lucide-arrow-left"
      class="mb-6 hover:translate-x-[-4px] transition-transform duration-200"
    >
      Etkinliklere dön
    </UButton>

    <!-- Yükleme: route zaten açık; yalnızca ana içerik skeleton -->
    <div
      v-if="pending && !event"
      class="space-y-6"
    >
      <div class="ticket-stub flex flex-col md:flex-row h-96 opacity-75 animate-pulse">
        <div class="w-full md:w-1/2 bg-neutral-200 dark:bg-neutral-800" />
        <div class="ticket-tear-horizontal block md:hidden" />
        <div class="ticket-tear-vertical hidden md:block" />
        <div class="flex-1 p-8 space-y-4">
          <USkeleton class="h-6 w-1/4 bg-neutral-200 dark:bg-neutral-800" />
          <USkeleton class="h-10 w-3/4 bg-neutral-200 dark:bg-neutral-800" />
          <USkeleton class="h-6 w-1/2 bg-neutral-200 dark:bg-neutral-800" />
          <div class="space-y-2 pt-4">
            <USkeleton class="h-4 w-full bg-neutral-200 dark:bg-neutral-800" />
            <USkeleton class="h-4 w-full bg-neutral-200 dark:bg-neutral-800" />
            <USkeleton class="h-4 w-2/3 bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <USkeleton
          v-for="n in 2"
          :key="n"
          class="h-24 rounded-lg"
        />
      </div>
    </div>

    <!-- 12. Hata Durumu (Bilet Temalı ve Kullanıcı Dostu - Ham Hata Gizlendi) -->
    <div
      v-else-if="error && !event"
      class="max-w-2xl mx-auto ticket-stub flex flex-col items-center text-center p-10 gap-6 border-red-500/20 dark:border-red-500/10"
    >
      <div class="rounded-full bg-red-50 dark:bg-red-950/20 p-4 text-red-500">
        <UIcon
          name="i-lucide-triangle-alert"
          class="size-10 animate-pulse"
        />
      </div>
      <div class="space-y-2">
        <h3 class="font-ticket text-lg font-bold text-neutral-900 dark:text-white tracking-wider">
          BAĞLANTI KESİLDİ
        </h3>
        <p class="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed">
          Etkinlik detayları yüklenirken bir sorun oluştu. Sistem geçici olarak yoğun olabilir veya internet bağlantınız kesilmiş olabilir.
        </p>
      </div>
      <div class="ticket-barcode max-w-xs text-red-500/20 opacity-40" />
      <UButton
        color="primary"
        variant="solid"
        icon="i-lucide-refresh-cw"
        class="transition-transform duration-200 hover:scale-105 active:scale-95 hover:brightness-110"
        @click="refresh()"
      >
        Tekrar Dene
      </UButton>
    </div>

    <article
      v-else-if="event"
      class="space-y-8"
    >
      <div class="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div class="space-y-8">
          <!-- Ana Bilet Görseli ve Başlık Alanı -->
          <div class="ticket-stub flex-col">
            <div class="relative h-80 sm:h-96 w-full overflow-hidden">
              <EventCoverImage
                :src="event.image"
                :alt="event.name"
                mode="hero"
                eager
              />
              <div class="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <span
                class="font-ticket absolute bottom-4 left-4 z-[3] rounded px-2.5 py-1 text-xs font-bold shadow-md"
                :class="categoryBadgeClass"
              >
                {{ categoryLabel }}
              </span>
            </div>

            <div class="ticket-tear-horizontal" />

            <div class="p-6 sm:p-8 space-y-6">
              <div class="flex flex-wrap items-center gap-2">
                <UBadge
                  v-if="genreLabel && genreLabel !== 'Genel'"
                  color="neutral"
                  variant="subtle"
                  class="font-ticket"
                >
                  {{ genreLabel }}
                </UBadge>
                <UBadge
                  v-if="statusText"
                  :color="event.status === 'cancelled' || event.status === 'canceled' ? 'error' : 'success'"
                  variant="subtle"
                  class="font-ticket"
                >
                  {{ statusText }}
                </UBadge>
              </div>

              <h1 class="font-ticket text-3xl font-extrabold leading-tight sm:text-4xl text-neutral-900 dark:text-white">
                {{ event.name }}
              </h1>

              <div class="font-ticket flex flex-wrap gap-x-6 gap-y-3 text-xs text-neutral-500 dark:text-neutral-400">
                <span class="flex items-center gap-2">
                  <UIcon
                    name="i-lucide-calendar"
                    class="size-4 text-primary"
                  />
                  {{ event.dateLabel }}
                </span>
                <span
                  v-if="event.city"
                  class="flex items-center gap-2"
                >
                  <UIcon
                    name="i-lucide-map-pin"
                    class="size-4 text-primary"
                  />
                  {{ event.city }}
                </span>
                <span
                  v-if="event.priceLabel"
                  class="flex items-center gap-2"
                >
                  <UIcon
                    name="i-lucide-banknote"
                    class="size-4 text-primary"
                  />
                  {{ event.priceLabel }}
                </span>
              </div>

              <div class="flex flex-wrap gap-3 pt-2">
                <UButton
                  :color="favorited ? 'primary' : 'neutral'"
                  :variant="favorited ? 'solid' : 'outline'"
                  icon="i-lucide-heart"
                  size="lg"
                  class="transition-transform duration-200 hover:scale-105 active:scale-95"
                  @click="toggleFavorite"
                >
                  {{ favorited ? 'Favorilerde' : 'Favorilere ekle' }}
                </UButton>
                <UButton
                  v-if="canBuyTicket && event.ticketUrl"
                  :href="event.ticketUrl"
                  target="_blank"
                  rel="noopener"
                  size="lg"
                  trailing-icon="i-lucide-external-link"
                  class="transition-transform duration-200 hover:scale-105 active:scale-95"
                >
                  Ticketmaster’da bilet al
                </UButton>
                <UButton
                  v-else
                  size="lg"
                  trailing-icon="i-lucide-link-off"
                  color="neutral"
                  variant="outline"
                  disabled
                >
                  Bilet linki güncelleniyor
                </UButton>
                <UButton
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-calendar-plus"
                  size="lg"
                  class="transition-transform duration-200 hover:scale-105 active:scale-95"
                  @click="downloadIcs"
                >
                  Takvime ekle
                </UButton>
                <UButton
                  v-if="googleCalendarUrl"
                  :to="googleCalendarUrl"
                  target="_blank"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-calendar"
                  size="lg"
                >
                  Google Takvim
                </UButton>
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-share-2"
                  size="lg"
                  class="transition-transform duration-200 hover:scale-105 active:scale-95"
                  @click="shareEvent"
                >
                  Paylaş
                </UButton>
              </div>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xl">
                <template v-if="canBuyTicket">
                  Bilet satışı Ticketmaster üzerinden yapılır; Evently yalnızca keşif sağlar.
                </template>
                <template v-else>
                  Bu etkinlik için güvenli bir bilet linki yok. Lütfen daha sonra tekrar deneyin.
                </template>
              </p>

              <!-- 8. Barkod Deseni Çeşitliliği: Detay sayfasındaki bilet stub'ına da dinamik barkod eklendi -->
              <div
                class="ticket-barcode mt-6 pt-2 text-neutral-300 dark:text-neutral-800 opacity-40"
                :style="barcodeStyle"
              />
            </div>
          </div>

          <section
            v-if="!belowFoldReady && galleryImages.length > 1"
            class="space-y-4"
            aria-hidden="true"
          >
            <USkeleton class="h-6 w-32" />
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <USkeleton
                v-for="n in 3"
                :key="n"
                class="aspect-[4/3] rounded-lg"
              />
            </div>
          </section>

          <section
            v-else-if="belowFoldReady && galleryImages.length > 1"
            class="space-y-4"
          >
            <h2 class="font-ticket text-lg font-bold text-neutral-900 dark:text-white">
              Görseller
            </h2>
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <button
                v-for="image in galleryImages"
                :key="image"
                type="button"
                class="ticket-stub overflow-hidden p-0 aspect-[4/3]"
                @click="selectedImage = image"
              >
                <img
                  :src="image"
                  :alt="event.name"
                  class="h-full w-full object-cover object-center"
                  loading="lazy"
                  decoding="async"
                >
              </button>
            </div>
          </section>

          <!-- Etkinlik Açıklaması -->
          <section
            v-if="infoText"
            class="ticket-stub flex-col p-6 sm:p-8 gap-4"
          >
            <h2 class="font-ticket text-lg font-bold text-neutral-900 dark:text-white border-b border-dashed border-neutral-200 dark:border-neutral-800 pb-2">
              Etkinlik bilgisi
            </h2>
            <p class="whitespace-pre-line text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {{ infoText }}
            </p>
          </section>

          <UAlert
            v-if="pleaseNoteText"
            color="warning"
            icon="i-lucide-info"
            title="Lütfen dikkat"
            :description="pleaseNoteText"
            class="border-amber-500/30 dark:border-amber-500/20"
          />

          <!-- Sanatçılar / Attractions -->
          <section
            v-if="!belowFoldReady && event.attractions?.length"
            class="space-y-4"
            aria-hidden="true"
          >
            <USkeleton class="h-6 w-28" />
            <div class="grid gap-4 sm:grid-cols-2">
              <div
                v-for="n in 2"
                :key="n"
                class="ticket-stub p-4 items-center gap-4"
              >
                <USkeleton class="size-14 rounded-full flex-none" />
                <div class="flex-1 space-y-2">
                  <USkeleton class="h-4 w-2/3" />
                  <USkeleton class="h-3 w-1/3" />
                </div>
              </div>
            </div>
          </section>

          <section
            v-else-if="belowFoldReady && event.attractions?.length"
            class="space-y-4"
          >
            <h2 class="font-ticket text-lg font-bold text-neutral-900 dark:text-white">
              Sanatçılar
            </h2>
            <div class="grid gap-4 sm:grid-cols-2">
              <div
                v-for="artist in event.attractions"
                :key="artist.id || artist.name"
                class="ticket-stub p-4 items-center gap-4 hover:border-primary-500/30 transition-all duration-300"
              >
                <UAvatar
                  :src="artist.image"
                  :alt="artist.name"
                  size="xl"
                  icon="i-lucide-user"
                  loading="lazy"
                  class="ring-2 ring-primary-500/20"
                />
                <div class="flex-1 min-w-0">
                  <p class="font-ticket text-sm font-bold text-neutral-900 dark:text-white truncate">
                    {{ artist.name }}
                  </p>
                  <p
                    v-if="artist.genre"
                    class="font-ticket text-[10px] text-neutral-400 mt-0.5 truncate"
                  >
                    {{ translateGenre(artist.genre) }}
                  </p>
                  <UButton
                    v-if="artist.url"
                    :to="artist.url"
                    target="_blank"
                    variant="link"
                    size="xs"
                    trailing-icon="i-lucide-arrow-up-right"
                    class="px-0 mt-1"
                  >
                    Profil
                  </UButton>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Sağ Yan Panel (Mekan ve Oturma Planı) -->
        <aside class="space-y-6">
          <!-- Mekan: isim/adres hemen; ek detaylar below-fold -->
          <div
            v-if="venueInfo"
            class="ticket-stub flex-col p-6 gap-4"
          >
            <h2 class="font-ticket text-lg font-bold text-neutral-900 dark:text-white border-b border-dashed border-neutral-200 dark:border-neutral-800 pb-2">
              Mekan
            </h2>

            <div class="space-y-3">
              <p class="font-ticket text-base font-bold text-neutral-900 dark:text-white">
                {{ venueInfo.name }}
              </p>

              <div class="space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
                <p
                  v-if="venueAddress"
                  class="flex items-start gap-2"
                >
                  <UIcon
                    name="i-lucide-map-pin"
                    class="size-4 mt-0.5 text-primary flex-none"
                  />
                  <span>{{ venueAddress }}</span>
                </p>
                <p
                  v-if="venueBoxOffice"
                  class="flex items-start gap-2"
                >
                  <UIcon
                    name="i-lucide-ticket"
                    class="size-4 mt-0.5 text-primary flex-none"
                  />
                  <span class="whitespace-pre-line">Gişe: {{ venueBoxOffice }}</span>
                </p>
                <p
                  v-if="venueBoxOfficePhone"
                  class="flex items-start gap-2"
                >
                  <UIcon
                    name="i-lucide-phone"
                    class="size-4 mt-0.5 text-primary flex-none"
                  />
                  <span>{{ venueBoxOfficePhone }}</span>
                </p>
                <p
                  v-if="venueParking"
                  class="flex items-start gap-2"
                >
                  <UIcon
                    name="i-lucide-car"
                    class="size-4 mt-0.5 text-primary flex-none"
                  />
                  <span class="whitespace-pre-line">Otopark / ulaşım: {{ venueParking }}</span>
                </p>
                <p
                  v-if="venueRules"
                  class="flex items-start gap-2 text-xs text-neutral-400 dark:text-neutral-500"
                >
                  <UIcon
                    name="i-lucide-info"
                    class="size-4 mt-0.5 text-neutral-400 flex-none"
                  />
                  <span class="whitespace-pre-line">{{ venueRules }}</span>
                </p>
                <p
                  v-if="venueChildRule"
                  class="flex items-start gap-2 text-xs text-neutral-400 dark:text-neutral-500"
                >
                  <UIcon
                    name="i-lucide-baby"
                    class="size-4 mt-0.5 text-neutral-400 flex-none"
                  />
                  <span class="whitespace-pre-line">{{ venueChildRule }}</span>
                </p>
                <p
                  v-if="venueAccessibility"
                  class="flex items-start gap-2 text-xs text-neutral-400 dark:text-neutral-500"
                >
                  <UIcon
                    name="i-lucide-accessibility"
                    class="size-4 mt-0.5 text-neutral-400 flex-none"
                  />
                  <span class="whitespace-pre-line">{{ venueAccessibility }}</span>
                </p>
              </div>

              <div class="flex flex-wrap gap-2 pt-2">
                <UButton
                  v-if="mapLink"
                  :to="mapLink"
                  target="_blank"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-map"
                  size="sm"
                  class="w-full justify-center"
                >
                  Haritada aç
                </UButton>
                <UButton
                  v-if="venueInfo.url"
                  :to="venueInfo.url"
                  target="_blank"
                  variant="link"
                  size="xs"
                  trailing-icon="i-lucide-arrow-up-right"
                  class="mx-auto"
                >
                  Mekan sayfası
                </UButton>
              </div>
            </div>
          </div>

          <!-- Oturma planı: kabuk API ile birlikte — below-fold gecikmesi yok -->
          <div
            v-if="event.seatmap"
            class="ticket-stub flex-col p-6 gap-4"
          >
            <h2 class="font-ticket text-lg font-bold text-neutral-900 dark:text-white border-b border-dashed border-neutral-200 dark:border-neutral-800 pb-2">
              Oturma planı
            </h2>
            <div class="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
              <img
                :src="event.seatmap"
                alt="Oturma planı"
                class="w-full hover:scale-105 transition-transform duration-300"
                loading="lazy"
                decoding="async"
              >
            </div>
          </div>
        </aside>
      </div>
    </article>

    <div
      ref="similarSentinel"
      class="min-h-8"
      aria-hidden="true"
    />
    <ClientOnly>
      <LazySimilarEvents
        v-if="event && similarVisible"
        :event="event"
      />
    </ClientOnly>

    <UModal
      v-model:open="galleryOpen"
      :ui="{ content: 'max-w-4xl p-0 overflow-hidden' }"
    >
      <template #content>
        <img
          v-if="selectedImage"
          :src="selectedImage"
          :alt="event?.name"
          class="w-full h-auto object-contain max-h-[80vh] bg-black"
          loading="lazy"
          decoding="async"
        >
      </template>
    </UModal>
  </UContainer>
</template>
