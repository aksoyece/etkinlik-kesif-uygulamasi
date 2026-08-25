<script setup lang="ts">
const route = useRoute()
const favorites = useFavoritesStore()

  const items = computed(() => [
    { label: 'Keşfet', to: '/', icon: 'i-lucide-compass' },
    { label: 'Etkinlikler', to: '/events', icon: 'i-lucide-ticket' },
    { label: 'Favoriler', to: '/favorites', icon: 'i-lucide-heart' }
  ])

onMounted(() => {
  favorites.init()
})
</script>

<template>
  <UHeader :ui="{ container: 'max-w-7xl' }">
    <template #left>
      <NuxtLink
        to="/"
        class="flex items-center gap-2 font-semibold text-highlighted"
      >
        <UIcon
          name="i-lucide-ticket"
          class="size-6 text-primary"
        />
        <span class="font-ticket hidden text-sm sm:inline">Admit One</span>
      </NuxtLink>
    </template>

    <UNavigationMenu
      :items="items"
      class="hidden lg:flex"
    />

    <template #right>
      <UChip
        :text="favorites.count"
        :show="favorites.count > 0"
        color="primary"
        size="sm"
      >
        <UButton
          to="/favorites"
          icon="i-lucide-heart"
          color="neutral"
          variant="ghost"
          aria-label="Favoriler"
        />
      </UChip>
      <ClientOnly>
        <UColorModeButton />
      </ClientOnly>
    </template>

    <template #body>
      <UNavigationMenu
        :items="items"
        orientation="vertical"
        class="-mx-2.5"
      />
    </template>
  </UHeader>
</template>
