<script setup lang="ts">
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ]
})
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
        <p class="font-ticket text-xs text-muted">
          Etkinlik Keşif • Ticketmaster Discovery API • {{ new Date().getFullYear() }}
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
