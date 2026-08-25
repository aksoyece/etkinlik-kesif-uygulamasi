<script setup lang="ts">
import type { EventSummary } from '#shared/types/event'
import { PAGE_SIZE } from '#shared/utils/filters'

const props = defineProps<{
  events: EventSummary[]
  pending?: boolean
  error?: string | null
  empty?: boolean
  total?: number
  page?: number
}>()

const emit = defineEmits<{
  'update:page': [page: number]
  retry: []
}>()

const currentPage = computed({
  get: () => props.page || 1,
  set: (value: number) => emit('update:page', value)
})
</script>

<template>
  <div class="space-y-8">
    <!-- 7. Loading State: Gerçek Bilet Taslakları Şeklinde Skeleton'lar -->
    <!-- 4. SPACING: Kartlar arası gap (grid-cols arası boşluk) artırılarak gap-8 sm:gap-10 yapıldı -->
    <div
      v-if="pending"
      class="grid gap-8 sm:gap-10 sm:grid-cols-1 lg:grid-cols-2"
    >
      <div
        v-for="n in 6"
        :key="n"
        class="ticket-stub flex flex-col sm:flex-row h-full opacity-75 animate-pulse"
      >
        <!-- Görsel Skeleton (Sabit aspect-[4/3] yapıldı) -->
        <div class="w-full sm:w-[40%] aspect-[4/3] bg-neutral-200 dark:bg-neutral-800 flex-none" />
        
        <!-- Mobil Yatay Yırtılma Çizgisi -->
        <div class="ticket-tear-horizontal block sm:hidden" />

        <!-- Masaüstü Dikey Yırtılma Çizgisi -->
        <div class="ticket-tear-vertical hidden sm:block" />

        <!-- Detaylar Skeleton (Kart içi padding p-6 sm:p-7 yapıldı) -->
        <div class="flex flex-1 flex-col gap-4 p-6 sm:p-7">
          <div class="space-y-2">
            <USkeleton class="h-5 w-3/4 bg-neutral-200 dark:bg-neutral-800" />
            <USkeleton class="h-4 w-1/2 bg-neutral-200 dark:bg-neutral-800" />
          </div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-3 mt-2">
            <div class="space-y-1">
              <USkeleton class="h-2.5 w-1/3 bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
              <USkeleton class="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            </div>
            <div class="space-y-1">
              <USkeleton class="h-2.5 w-1/3 bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
              <USkeleton class="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            </div>
            <div class="col-span-2 space-y-1">
              <USkeleton class="h-2.5 w-1/4 bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
              <USkeleton class="h-4 w-11/12 bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            </div>
          </div>
          <div class="mt-auto pt-4">
            <USkeleton class="h-8 w-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          </div>
        </div>
      </div>
    </div>

    <!-- 6. EMPTY/ERROR STATE: API hatası durumunda kullanıcı dostu bilet temalı hata kartı (ham hata mesajı gizlendi) -->
    <div
      v-else-if="error"
      class="max-w-2xl mx-auto ticket-stub flex flex-col items-center text-center p-10 gap-6 border-red-500/20 dark:border-red-500/10"
    >
      <div class="rounded-full bg-red-50 dark:bg-red-950/20 p-4 text-red-500">
        <UIcon name="i-lucide-triangle-alert" class="size-10 animate-pulse" />
      </div>
      <div class="space-y-2">
        <h3 class="font-ticket text-lg font-bold text-neutral-900 dark:text-white tracking-wider">BAĞLANTI KESİLDİ</h3>
        <p class="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed">
          Etkinlik biletleri yüklenirken bir sorun oluştu. Sistem geçici olarak yoğun olabilir veya internet bağlantınız kesilmiş olabilir.
        </p>
      </div>
      <div class="ticket-barcode max-w-xs text-red-500/20 opacity-40" />
      <UButton
        color="primary"
        variant="solid"
        icon="i-lucide-refresh-cw"
        class="transition-transform duration-200 hover:scale-105 active:scale-95 hover:brightness-110"
        @click="emit('retry')"
      >
        Gişeyi Yenile
      </UButton>
    </div>

    <!-- 6. EMPTY/ERROR STATE: Filtre sonucu boş geldiğinde bilet temalı "boş bilet gişesi" tasarımı -->
    <div
      v-else-if="empty"
      class="max-w-2xl mx-auto ticket-stub flex flex-col items-center text-center p-10 gap-6 border-dashed border-neutral-300 dark:border-neutral-800"
    >
      <div class="relative">
        <div class="rounded-full bg-neutral-100 dark:bg-neutral-800/50 p-4 text-neutral-400 dark:text-neutral-500">
          <UIcon name="i-lucide-store" class="size-10" />
        </div>
        <div class="absolute -bottom-1 -right-1 rounded-full bg-amber-500 p-1 text-white ring-2 ring-white dark:ring-neutral-900">
          <UIcon name="i-lucide-ticket" class="size-3" />
        </div>
      </div>
      <div class="space-y-2">
        <h3 class="font-ticket text-lg font-bold text-neutral-900 dark:text-white tracking-wider">BİLET GİŞESİ BOŞ</h3>
        <p class="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed">
          Aradığınız kriterlere uygun aktif bir etkinlik bulamadık. Lütfen filtrelerinizi veya arama kelimenizi güncelleyip tekrar deneyin.
        </p>
      </div>
      <div class="ticket-barcode max-w-xs text-neutral-300 dark:text-neutral-800 opacity-40" />
    </div>

    <!-- Etkinlik Listesi -->
    <template v-else>
      <!-- 4. SPACING: Kartlar arası gap (grid-cols arası boşluk) artırılarak gap-8 sm:gap-10 yapıldı -->
      <div class="grid gap-8 sm:gap-10 sm:grid-cols-1 lg:grid-cols-2">
        <EventCard
          v-for="event in events"
          :key="event.id"
          :event="event"
        />
      </div>

      <!-- Sayfalama (Pagination) -->
      <div
        v-if="(total || 0) > PAGE_SIZE"
        class="flex justify-center pt-4"
      >
        <UPagination
          v-model:page="currentPage"
          :total="total"
          :items-per-page="PAGE_SIZE"
          :sibling-count="1"
          show-edges
        />
      </div>
    </template>
  </div>
</template>
