<script setup lang="ts">
const year = 2026

const exploreLinks = [
  { label: 'Etkinlikler', to: '/events' },
  { label: 'Keşfet', to: '/' },
  { label: 'Favoriler', to: '/favorites' }
] as const

const aboutLinks = [
  {
    label: 'Ticketmaster',
    to: 'https://www.ticketmaster.co.uk/',
    external: true
  },
  {
    label: 'Veri Kaynağı',
    to: 'https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/',
    external: true
  },
  {
    label: 'Gizlilik',
    to: 'https://privacy.ticketmaster.com/',
    external: true
  }
] as const
</script>

<template>
  <footer class="app-footer relative mt-auto overflow-hidden border-t border-neutral-200/80 dark:border-neutral-800/80">
    <!-- Üst accent çizgisi -->
    <div
      class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#E8432E] to-transparent opacity-90"
      aria-hidden="true"
    />

    <!-- Hafif gradient + nokta doku -->
    <div
      class="pointer-events-none absolute inset-0 bg-gradient-to-b from-neutral-100/40 via-transparent to-transparent dark:from-[#1C1C1C]/80 dark:via-[#151515]/40 dark:to-transparent"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-20"
      style="background-image: radial-gradient(circle at 1px 1px, rgb(232 67 46 / 0.12) 1px, transparent 0); background-size: 18px 18px;"
      aria-hidden="true"
    />

    <!-- Sağ üstte çok hafif barcode dekoru -->
    <div
      class="pointer-events-none absolute right-4 top-3 hidden h-7 w-28 opacity-[0.14] dark:opacity-[0.2] sm:block"
      aria-hidden="true"
      style="background-image: repeating-linear-gradient(90deg, currentColor 0 1.5px, transparent 1.5px 4px); color: #E8432E;"
    />

    <div class="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-9 lg:px-8">
      <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-12 lg:gap-6">
        <!-- Sol: marka -->
        <div class="space-y-2.5 lg:col-span-4">
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-2 group"
          >
            <AppLogo
              size="h-5 w-8 transition-transform duration-200 group-hover:scale-105"
            />
            <span class="font-ticket text-base font-bold tracking-tight text-[#1A1A1A] dark:text-[#F7F5F0]">
              Evently
            </span>
          </NuxtLink>
          <p class="max-w-[16rem] text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            Etkinlikleri keşfet. Anını yakala.
          </p>
        </div>

        <!-- Orta: link kolonları -->
        <div class="grid grid-cols-2 gap-6 sm:gap-8 lg:col-span-5">
          <div class="space-y-3">
            <h2 class="font-ticket text-[10px] font-bold tracking-widest text-neutral-400 dark:text-neutral-500 uppercase">
              Keşfet
            </h2>
            <ul class="space-y-2">
              <li
                v-for="link in exploreLinks"
                :key="link.to"
              >
                <NuxtLink
                  :to="link.to"
                  class="text-sm text-neutral-600 transition-colors duration-200 hover:text-[#E8432E] dark:text-neutral-300 dark:hover:text-[#E8432E]"
                >
                  {{ link.label }}
                </NuxtLink>
              </li>
            </ul>
          </div>

          <div class="space-y-3">
            <h2 class="font-ticket text-[10px] font-bold tracking-widest text-neutral-400 dark:text-neutral-500 uppercase">
              Hakkında
            </h2>
            <ul class="space-y-2">
              <li
                v-for="link in aboutLinks"
                :key="link.label"
              >
                <NuxtLink
                  :to="link.to"
                  :target="link.external ? '_blank' : undefined"
                  :rel="link.external ? 'noopener noreferrer' : undefined"
                  class="inline-flex items-center gap-1 text-sm text-neutral-600 transition-colors duration-200 hover:text-[#E8432E] dark:text-neutral-300 dark:hover:text-[#E8432E]"
                >
                  {{ link.label }}
                  <UIcon
                    v-if="link.external"
                    name="i-lucide-arrow-up-right"
                    class="size-3 opacity-50"
                  />
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>

        <!-- Sağ: veri notu -->
        <div class="lg:col-span-3 lg:justify-self-end lg:text-right">
          <p class="max-w-[14rem] text-xs leading-relaxed text-neutral-400 dark:text-neutral-500 lg:ml-auto">
            Veriler Ticketmaster tarafından sağlanmaktadır.
          </p>
        </div>
      </div>

      <!-- Alt çizgi + copyright -->
      <div class="mt-8 border-t border-dashed border-neutral-200 dark:border-neutral-800 pt-4">
        <p class="font-ticket text-center text-[10px] tracking-wide text-neutral-400 dark:text-neutral-500 sm:text-left">
          © {{ year }} Evently · Designed &amp; developed by Ece Aksoy
        </p>
      </div>
    </div>
  </footer>
</template>
