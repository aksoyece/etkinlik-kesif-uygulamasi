import { defineStore } from 'pinia'
import type { FavoriteEvent } from '#shared/types/event'
import {
  FAVORITES_STORAGE_KEY,
  isFavoriteEvent,
  toggleFavoriteEvent
} from '#shared/utils/event'

export const useFavoritesStore = defineStore('favorites', () => {
  const items = ref<FavoriteEvent[]>([])
  const ready = ref(false)

  function readStorage(): FavoriteEvent[] {
    if (!import.meta.client) {
      return []
    }

    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY)
      return raw ? JSON.parse(raw) as FavoriteEvent[] : []
    } catch {
      return []
    }
  }

  function writeStorage(value: FavoriteEvent[]) {
    if (!import.meta.client) {
      return
    }

    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(value))
  }

  function init() {
    if (ready.value || !import.meta.client) {
      return
    }

    items.value = readStorage()
    ready.value = true
  }

  init()

  if (import.meta.client) {
    watch(items, (value) => {
      if (ready.value) {
        writeStorage(value)
      }
    }, { deep: true })
  }

  const count = computed(() => items.value.length)

  function isFavorite(id: string) {
    return isFavoriteEvent(items.value, id)
  }

  function toggle(event: FavoriteEvent) {
    init()
    items.value = toggleFavoriteEvent(items.value, event)
    return isFavorite(event.id)
  }

  function remove(id: string) {
    items.value = items.value.filter(item => item.id !== id)
  }

  function clear() {
    items.value = []
  }

  return {
    items,
    count,
    ready,
    isFavorite,
    toggle,
    remove,
    clear,
    init
  }
})
