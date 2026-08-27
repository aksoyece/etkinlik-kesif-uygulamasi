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
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'apple-touch-icon', href: '/logo.svg' }
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
    <div class="flex min-h-dvh flex-col">
      <AppHeader />

      <UMain class="flex-1">
        <NuxtPage />
      </UMain>

      <AppFooter />
    </div>
  </UApp>
</template>
