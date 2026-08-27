<script setup lang="ts">
const route = useRoute()

useHead({
  title: 'Evently',
  // Sayfa title’ı ne olursa olsun sekme metni hep Evently kalsın
  titleTemplate: () => 'Evently',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ]
})

// Unhead yarışı / eski cache: rota değişince sekme başlığını kilitle
watch(
  () => route.fullPath,
  () => {
    if (import.meta.client) {
      document.title = 'Evently'
    }
  },
  { immediate: true }
)
</script>

<template>
  <UApp>
    <AppHeader />

    <UMain>
      <NuxtPage />
    </UMain>

    <USeparator />

    <UFooter :ui="{ container: 'max-w-7xl' }">
      <template #left>
        <p class="font-ticket text-xs text-muted tracking-widest">
          Evently • Admit One • {{ new Date().getFullYear() }}
        </p>
      </template>
      <template #right>
        <UButton
          to="https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/"
          target="_blank"
          color="neutral"
          variant="ghost"
          trailing-icon="i-lucide-arrow-up-right"
        >
          API dokümantasyonu
        </UButton>
      </template>
    </UFooter>
  </UApp>
</template>
