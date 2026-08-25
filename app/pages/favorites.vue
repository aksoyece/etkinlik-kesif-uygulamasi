<script setup lang="ts">
import { sortFavoritesByDate } from '#shared/utils/calendar'

const favorites = useFavoritesStore()
const sortedFavorites = computed(() => sortFavoritesByDate(favorites.items))

useSeoMeta({
  title: 'Favoriler',
  description: 'Kaydettiğiniz yaklaşan etkinlikler, tarihe göre sıralanır.'
})

onMounted(() => {
  favorites.init()
})
</script>

<template>
  <UContainer class="py-8 sm:py-12">
    <div class="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="font-ticket text-xs text-[#E8432E]">
          Stub book
        </p>
        <h1 class="font-ticket text-3xl text-[#1A1A1A] dark:text-[#F7F5F0]">
          Favoriler
        </h1>
        <p class="text-muted">
          {{ favorites.count }} etkinlik kaydedildi. En yakın tarih en üstte.
        </p>
      </div>
      <UButton
        v-if="favorites.count"
        color="neutral"
        variant="outline"
        icon="i-lucide-trash"
        class="transition-transform duration-200 hover:scale-105 active:scale-95"
        @click="favorites.clear()"
      >
        Tümünü temizle
      </UButton>
    </div>

    <!-- 6. EMPTY/ERROR STATE: Bilet Temalı Premium Boş Favoriler Sayfası -->
    <div
      v-if="!favorites.count"
      class="max-w-2xl mx-auto ticket-stub flex flex-col items-center text-center p-10 gap-6 border-dashed border-neutral-300 dark:border-neutral-800"
    >
      <div class="rounded-full bg-neutral-100 dark:bg-neutral-800/50 p-4 text-neutral-400">
        <UIcon
          name="i-lucide-heart"
          class="size-10 text-[#E8432E]"
        />
      </div>
      <div class="space-y-2">
        <h3 class="font-ticket text-lg font-bold text-neutral-900 dark:text-white tracking-wider">
          HENÜZ FAVORİ YOK
        </h3>
        <p class="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed">
          Beğendiğiniz etkinlikleri bilet kartlarındaki kalp ikonuyla favorilerinize kaydedebilirsiniz.
        </p>
      </div>
      <div class="ticket-barcode max-w-xs text-neutral-300 dark:text-neutral-800 opacity-40" />
      <UButton
        to="/events"
        color="primary"
        variant="solid"
        icon="i-lucide-ticket"
        class="transition-transform duration-200 hover:scale-105 active:scale-95 hover:brightness-110"
      >
        Etkinliklere Git
      </UButton>
    </div>

    <!-- 4. SPACING: Kartlar arası gap (grid-cols arası boşluk) artırılarak gap-8 sm:gap-10 yapıldı -->
    <div
      v-else
      class="grid gap-8 sm:gap-10 sm:grid-cols-1 lg:grid-cols-2"
    >
      <EventCard
        v-for="event in sortedFavorites"
        :key="event.id"
        :event="event"
      />
    </div>
  </UContainer>
</template>
