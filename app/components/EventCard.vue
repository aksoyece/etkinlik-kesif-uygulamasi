<script setup lang="ts">
import type { EventSummary, FavoriteEvent } from '#shared/types/event'
import { toFavoriteEvent } from '#shared/utils/event'

const props = defineProps<{
  event: EventSummary | FavoriteEvent
}>()

const favorites = useFavoritesStore()
const toast = useToast()

const favorited = computed(() => favorites.isFavorite(props.event.id))

// 5. MICRO-INTERACTIONS: Kalp ikonu tıklandığında animasyonu tetiklemek için ref
const isHeartAnimating = ref(false)

// 3 & 5. Türkçe Kategori Çevirisi ve Undefined Temizliği
const categoryLabel = computed(() => {
  const cat = props.event.category
  if (!cat || cat.toUpperCase() === 'UNDEFINED') {
    return 'Genel'
  }
  const upper = cat.toUpperCase()
  if (upper.includes('MUSIC')) return 'Müzik'
  if (upper.includes('SPORTS')) return 'Spor'
  if (upper.includes('ARTS') || upper.includes('THEATRE')) return 'Sanat & Tiyatro'
  if (upper.includes('FAMILY')) return 'Aile'
  if (upper.includes('FILM')) return 'Film'
  if (upper.includes('MISCELLANEOUS')) return 'Diğer'
  return cat
})

// 3 & 5. Türkçe Tür Çevirisi ve Undefined Temizliği
const genreLabel = computed(() => {
  const raw = 'genre' in props.event ? props.event.genre : undefined
  if (!raw || raw.toUpperCase() === 'UNDEFINED') {
    return 'Genel'
  }
  const upper = raw.toUpperCase()
  if (upper === 'ROCK') return 'Rock'
  if (upper === 'POP') return 'Pop'
  if (upper === 'JAZZ') return 'Caz'
  if (upper === 'CLASSICAL') return 'Klasik Müzik'
  if (upper === 'METAL') return 'Metal'
  if (upper === 'HIP-HOP' || upper === 'HIP HOP') return 'Hip-Hop'
  if (upper === 'RAP') return 'Rap'
  if (upper === 'ALTERNATIVE' || upper === 'ALTERNATIVE ROCK') return 'Alternatif'
  if (upper === 'COMEDY') return 'Komedi'
  if (upper === 'THEATRE' || upper === 'DRAMA') return 'Tiyatro'
  if (upper === 'DANCE' || upper === 'ELECTRONIC') return 'Elektronik'
  if (upper === 'FOLK') return 'Halk Müziği'
  if (upper === 'BLUES') return 'Blues'
  if (upper === 'SOUL') return 'Soul'
  if (upper === 'REGGAE') return 'Reggae'
  if (upper === 'INDIE') return 'Bağımsız'
  if (upper === 'FAMILY' || upper === 'CHILDREN') return 'Aile / Çocuk'
  if (upper === 'OTHER' || upper === 'MISCELLANEOUS') return 'Diğer'
  return raw
})

const when = computed(() => props.event.dateLabel || 'Tarih Açıklanacak')
const venueName = computed(() => props.event.venue || 'Mekan Açıklanacak')
const cityName = computed(() => props.event.city || 'Şehir Açıklanacak')
const price = computed(() => props.event.priceLabel || 'Fiyat bilgisi yok')

// 1. RENK PALETİ: Kategori rozetleri renk kodlaması
// Kırmızı accent (#E8432E) sadece FILM (en öne çıkan) kategorisinde kullanılır.
// Diğerleri: konser turuncu, spor mavi, tiyatro/sanat mor, aile/family yeşil, miscellaneous gri
const categoryBadgeClass = computed(() => {
  const cat = (props.event.category || '').toUpperCase()
  if (cat.includes('MUSIC')) return 'bg-amber-500 text-white' // Konser: Turuncu
  if (cat.includes('SPORTS')) return 'bg-blue-600 text-white' // Spor: Mavi
  if (cat.includes('ARTS') || cat.includes('THEATRE')) return 'bg-purple-600 text-white' // Tiyatro/Sanat: Mor
  if (cat.includes('FAMILY')) return 'bg-emerald-600 text-white' // Aile: Yeşil
  if (cat.includes('FILM')) return 'bg-[#E8432E] text-white' // Film: Kırmızı (En öne çıkan kategori)
  return 'bg-neutral-500 text-white' // Miscellaneous / Diğer: Gri
})

// 8. Barkod Deseni Çeşitliliği: Etkinlik ID'sine göre tamamen benzersiz ve gerçekçi barkod deseni üretir
const barcodeStyle = computed(() => {
  const id = props.event.id || 'default'

  // Seeded LCG (Linear Congruential Generator)
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

  // 25 ila 35 adet çizgi oluşturarak gerçekçi bir barkod görünümü elde edilir
  const numLines = 25 + Math.floor(random() * 10)
  for (let i = 0; i < numLines; i++) {
    const lineWidth = Math.floor(random() * 3) + 1 // 1-3px
    const spaceWidth = Math.floor(random() * 4) + 1 // 1-4px

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
  // 5. MICRO-INTERACTIONS: Kalp ikonu tıklandığında scale bounce animasyonunu tetikle
  isHeartAnimating.value = true
  setTimeout(() => {
    isHeartAnimating.value = false
  }, 350)

  const added = favorites.toggle(toFavoriteEvent(props.event))
  toast.add({
    title: added ? 'Favorilere eklendi' : 'Favorilerden çıkarıldı',
    description: props.event.name,
    color: added ? 'success' : 'neutral',
    icon: added ? 'i-lucide-heart' : 'i-lucide-heart-off'
  })
}
</script>

<template>
  <article class="ticket-stub group flex-col sm:flex-row h-full">
    <!-- 3. GÖRSELLER: Sabit aspect-[4/3] yapıldı (mobilde ve masaüstünde) -->
    <NuxtLink
      :to="`/events/${event.id}`"
      class="relative block w-full sm:w-[40%] aspect-[4/3] overflow-hidden flex-none"
    >
      <img
        :src="event.image || '/placeholder-event.svg'"
        :alt="event.name"
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        decoding="async"
      >
      <!-- 3. GÖRSELLER: Görsel üstüne alttan yukarı doğru siyahtan şeffafa hafif gradient overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

      <!-- Dinamik Renkli Türkçe Kategori Rozeti -->
      <span
        class="font-ticket absolute bottom-3 left-3 rounded px-2 py-0.5 text-[9px] font-bold shadow-sm transition-colors duration-300"
        :class="categoryBadgeClass"
      >
        {{ categoryLabel }}
      </span>
    </NuxtLink>

    <!-- Mobil Yatay Yırtılma Çizgisi -->
    <div class="ticket-tear-horizontal block sm:hidden" />

    <!-- Masaüstü Dikey Yırtılma Çizgisi -->
    <div class="ticket-tear-vertical hidden sm:block" />

    <!-- 4. SPACING: Kart içi padding mevcuttan %20-30 artırılarak p-6 sm:p-7 yapıldı -->
    <div class="flex flex-1 flex-col gap-4 p-6 sm:p-7">
      <div class="flex items-start justify-between gap-3">
        <!-- 2. TİPOGRAFİ HİYERARŞİSİ: Etkinlik adı mevcut mono fonttan biraz daha büyük (text-lg) yapıldı, line-clamp-2 korundu -->
        <NuxtLink
          :to="`/events/${event.id}`"
          class="font-ticket line-clamp-2 text-lg font-bold leading-snug text-[#1A1A1A] hover:text-[#E8432E] dark:text-[#F7F5F0] dark:hover:text-[#E8432E] transition-colors duration-200"
        >
          {{ event.name }}
        </NuxtLink>
        <ClientOnly>
          <UButton
            square
            size="xs"
            :color="favorited ? 'primary' : 'neutral'"
            :variant="favorited ? 'solid' : 'ghost'"
            :icon="favorited ? 'i-lucide-heart' : 'i-lucide-heart'"
            class="transition-transform duration-200 hover:scale-110 active:scale-95 flex-none"
            :class="{ 'animate-heart-bounce': isHeartAnimating }"
            :aria-label="favorited ? 'Favorilerden çıkar' : 'Favorilere ekle'"
            @click.prevent="toggleFavorite"
          />
        </ClientOnly>
      </div>

      <!-- 2. TİPOGRAFİ HİYERARŞİSİ: Label ve Değerlerin ayrımı netleştirildi, İngilizce terimler Türkçeleştirildi -->
      <dl class="font-ticket grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <!-- Label: text-xs, opacity 50-60%, letter-spacing artırılmış -->
          <dt class="text-xs font-bold tracking-widest text-neutral-500 dark:text-neutral-400 opacity-60 uppercase">
            Tarih
          </dt>
          <!-- Değer: text-sm, font-weight 500-600, tam opak -->
          <dd class="ticket-line text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
            {{ when }}
          </dd>
        </div>
        <div>
          <dt class="text-xs font-bold tracking-widest text-neutral-500 dark:text-neutral-400 opacity-60 uppercase">
            Tür
          </dt>
          <dd class="ticket-line text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5 truncate">
            {{ genreLabel }}
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

      <!-- Dinamik Barkod -->
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
  </article>
</template>
