<script setup lang="ts">
const {
  state,
  schema,
  page,
  events,
  pending,
  empty,
  total,
  errorMessage,
  refresh,
  onSubmit,
  reset,
  onPageChange
} = useEventExplorer()

useSeoMeta({
  title: 'Evently',
  description: 'Evently ile yaklaşan konser, spor ve sanat etkinliklerini keşfedin.',
  ogTitle: 'Evently',
  ogDescription: 'Yaklaşan etkinlikleri keşfet. Admit One bilet konsepti.',
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UContainer class="py-8 sm:py-12">
    <!-- 4. SPACING: Hero section başlık ve açıklama arası boşluk artırıldı (space-y-6 yapıldı) -->
    <section class="mb-12 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
      <div class="space-y-6">
        <div class="space-y-3">
          <span class="font-ticket inline-flex w-fit rounded-full bg-neutral-200 dark:bg-neutral-800 px-2.5 py-1 text-[9px] text-neutral-600 dark:text-neutral-300 tracking-widest">
            ADMIT ONE • DISCOVER EVENTS
          </span>
          <h1 class="font-ticket text-4xl leading-tight text-[#1A1A1A] sm:text-5xl dark:text-[#F7F5F0]">
            Yaklaşan etkinlikleri keşfet
          </h1>
        </div>
        <!-- 4. SPACING: Açıklama paragrafının font-size'ı text-lg'den text-base'e küçültüldü -->
        <p class="max-w-2xl text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Konser, spor, tiyatro ve daha fazlasını arayın, şehre ve tarihe göre filtreleyin, favorilerinize kaydedin.
        </p>
        <div class="flex flex-wrap gap-3">
          <!-- 3. "Tüm etkinlikler" buton rengi: Önceki kırmızı ana CTA rengine (primary) geri çevrildi -->
          <UButton
            to="/events"
            color="primary"
            variant="solid"
            icon="i-lucide-ticket"
            size="lg"
            class="transition-transform duration-200 hover:scale-105 active:scale-95 hover:brightness-110"
          >
            Tüm etkinlikler
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

      <div class="ticket-stub p-6">
        <div class="flex-1 space-y-3 p-2">
          <p class="font-ticket text-[10px] text-neutral-400 dark:text-neutral-500">
            ADMIT ONE
          </p>
          <p class="font-ticket text-sm font-semibold">
            Evently Pass
          </p>
          <div class="ticket-barcode animate-pulse" />
        </div>
      </div>
    </section>

    <section class="space-y-8">
      <UForm
        :schema="schema"
        :state="state"
        class="ticket-stub flex-col space-y-4 p-5 sm:p-7"
        @submit="onSubmit"
      >
        <EventSearch
          v-model="state.keyword"
          @submit="onSubmit"
        />
        <!-- 5. Loading State: Filtre yüklenirken butona spinner eklemek için pending prop'u geçildi -->
        <EventFilters
          v-model="state"
          :pending="pending"
          @reset="reset"
        />
      </UForm>

      <EventList
        :events="events"
        :pending="pending"
        :error="errorMessage"
        :empty="empty"
        :total="total"
        :page="page"
        @update:page="onPageChange"
        @retry="refresh"
      />
    </section>
  </UContainer>
</template>
