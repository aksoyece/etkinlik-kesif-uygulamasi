<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const is404 = computed(() => props.error.statusCode === 404)

function handleClearError() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="min-h-screen bg-[#151515] text-[#F7F5F0] flex items-center justify-center p-4 sm:p-6 body">
    <!-- 9. 404 sayfası: Bilet temasına uygun özel bir 404/Hata tasarımı -->
    <div class="max-w-xl w-full ticket-stub flex-col border-red-500/20 dark:border-red-500/10 shadow-2xl">
      <!-- Üst Görsel / İllüstrasyon Alanı -->
      <div class="relative h-48 bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center overflow-hidden">
        <div class="absolute inset-0 bg-radial-gradient opacity-10" />
        <div class="z-10 flex flex-col items-center gap-2">
          <div class="rounded-full bg-red-500/10 p-4 text-[#E8432E] border border-red-500/20">
            <UIcon
              :name="is404 ? 'i-lucide-ticket-x' : 'i-lucide-triangle-alert'"
              class="size-12"
            />
          </div>
        </div>
        <!-- Bilet Perforasyon Süslemesi -->
        <div class="absolute bottom-2 left-4 font-ticket text-[10px] text-neutral-500 tracking-widest">
          TICKET STATUS: INVALID
        </div>
      </div>

      <div class="ticket-tear-horizontal" />

      <!-- İçerik Alanı -->
      <div class="p-8 flex flex-col items-center text-center gap-6">
        <div class="space-y-2">
          <p class="font-ticket text-xs text-[#E8432E] tracking-widest">
            ERROR CODE: {{ error.statusCode }}
          </p>
          <h1 class="font-ticket text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white leading-tight">
            {{ is404 ? 'GEÇERSİZ BİLET' : 'SİSTEM HATASI' }}
          </h1>
          <p class="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
            {{ is404 ? 'Aradığınız etkinlik veya sayfa bulunamadı. Bilet süresi dolmuş veya geçersiz bir kod kullanıyor olabilirsiniz.' : 'İşlem gerçekleştirilirken beklenmedik bir hata oluştu. Lütfen daha sonra tekrar deneyin.' }}
          </p>
        </div>

        <!-- Süs Barkodu -->
        <div class="ticket-barcode max-w-xs text-neutral-300 dark:text-neutral-800 opacity-40 h-10" />

        <!-- Eylem Butonu -->
        <UButton
          color="primary"
          variant="solid"
          size="lg"
          icon="i-lucide-home"
          class="transition-transform duration-200 hover:scale-105 active:scale-95 hover:brightness-110"
          @click="handleClearError"
        >
          Ana Sayfaya Dön
        </UButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.body {
  background:
    radial-gradient(circle at 1px 1px, rgb(247 245 240 / 0.05) 1px, transparent 0) 0 0 / 18px 18px,
    #151515;
}
</style>
