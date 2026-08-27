<script setup lang="ts">
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
        class="flex items-center gap-2.5 min-w-0"
      >
        <AppLogo size="h-6 w-9" />
        <span class="flex flex-col leading-none gap-1">
          <span class="text-lg font-bold tracking-tight text-highlighted">Evently</span>
          <span class="font-ticket hidden sm:inline-flex w-fit rounded-full bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 text-[8px] text-neutral-600 dark:text-neutral-300 tracking-widest">
            ADMIT ONE • KEŞFET
          </span>
        </span>
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
