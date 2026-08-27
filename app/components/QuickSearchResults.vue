<script setup lang="ts">
import type { EventListResult } from '#shared/types/event'
import type { QuickSearchResult } from '#shared/utils/quickSearch'
import {
  QUICK_SEARCH_DEBOUNCE_MS,
  QUICK_SEARCH_LIMIT,
  QUICK_SEARCH_MIN_CHARS,
  mapEventsToQuickSearchResults,
  toQuickSearchApiQuery,
  toQuickSearchEventsPath
} from '#shared/utils/quickSearch'

const keyword = ref('')
const open = ref(false)
const activeIndex = ref(-1)
const debouncedQuery = ref('')
const results = ref<QuickSearchResult[]>([])
const totalResults = ref(0)
const searching = ref(false)
const searchError = ref(false)

const router = useRouter()
const rootEl = ref<HTMLElement | null>(null)
const inputWrapEl = ref<HTMLElement | null>(null)
const panelEl = ref<HTMLElement | null>(null)
const inputId = useId()
const listboxId = `${inputId}-listbox`

const panelStyle = ref<Record<string, string>>({})

let debounceTimer: ReturnType<typeof setTimeout> | undefined
let requestSeq = 0

const showPanel = computed(() => open.value && debouncedQuery.value.trim().length >= QUICK_SEARCH_MIN_CHARS)
const activeOptionId = computed(() =>
  activeIndex.value >= 0 && results.value[activeIndex.value]
    ? results.value[activeIndex.value]!.id
    : undefined
)
const showEmpty = computed(() =>
  showPanel.value && !searching.value && !searchError.value && results.value.length === 0
)
const seeAllLabel = computed(() => {
  const total = totalResults.value
  if (total > 0) {
    return `Tüm ${total} sonucu gör`
  }
  return 'Tüm sonuçları gör'
})

function updatePanelPosition() {
  const rect = inputWrapEl.value?.getBoundingClientRect()
  if (!rect) return
  panelStyle.value = {
    position: 'fixed',
    top: `${Math.round(rect.bottom + 8)}px`,
    left: `${Math.round(rect.left)}px`,
    width: `${Math.round(rect.width)}px`,
    zIndex: '80'
  }
}

async function runSearch(query: string) {
  const q = query.trim()
  if (q.length < QUICK_SEARCH_MIN_CHARS) {
    results.value = []
    totalResults.value = 0
    searching.value = false
    searchError.value = false
    return
  }

  const seq = ++requestSeq
  searching.value = true
  searchError.value = false
  open.value = true
  await nextTick()
  updatePanelPosition()

  try {
    const data = await $fetch<EventListResult>('/api/events', {
      query: toQuickSearchApiQuery(q, QUICK_SEARCH_LIMIT)
    })
    if (seq !== requestSeq) return
    results.value = mapEventsToQuickSearchResults(data.events ?? [], QUICK_SEARCH_LIMIT)
    totalResults.value = data.total ?? results.value.length
    activeIndex.value = results.value.length ? 0 : -1
  } catch {
    if (seq !== requestSeq) return
    results.value = []
    totalResults.value = 0
    searchError.value = true
    activeIndex.value = -1
  } finally {
    if (seq === requestSeq) {
      searching.value = false
    }
  }
}

watch(keyword, (value) => {
  if (debounceTimer) clearTimeout(debounceTimer)

  if (!value.trim()) {
    debouncedQuery.value = ''
    results.value = []
    totalResults.value = 0
    searching.value = false
    searchError.value = false
    closePanel()
    return
  }

  if (value.trim().length < QUICK_SEARCH_MIN_CHARS) {
    debouncedQuery.value = value
    results.value = []
    totalResults.value = 0
    searching.value = false
    closePanel()
    return
  }

  debounceTimer = setTimeout(() => {
    debouncedQuery.value = value
    void runSearch(value)
  }, QUICK_SEARCH_DEBOUNCE_MS)
})

watch(showPanel, async (visible) => {
  if (!visible) return
  await nextTick()
  updatePanelPosition()
})

function closePanel() {
  open.value = false
  activeIndex.value = -1
}

function submitSearch() {
  closePanel()
  router.push(toQuickSearchEventsPath(keyword.value))
}

function goToResult(item: QuickSearchResult) {
  closePanel()
  router.push(item.href)
}

function onInputKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closePanel()
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    if (showPanel.value && activeIndex.value >= 0 && results.value[activeIndex.value]) {
      goToResult(results.value[activeIndex.value]!)
      return
    }
    submitSearch()
    return
  }

  if (!showPanel.value || !results.value.length) {
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % results.value.length
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = activeIndex.value <= 0
      ? results.value.length - 1
      : activeIndex.value - 1
  }
}

function onDocumentPointerDown(event: MouseEvent) {
  const target = event.target as Node | null
  if (!target) return
  if (rootEl.value?.contains(target) || panelEl.value?.contains(target)) {
    return
  }
  closePanel()
}

function onWindowChange() {
  if (showPanel.value) {
    updatePanelPosition()
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  window.addEventListener('resize', onWindowChange)
  window.addEventListener('scroll', onWindowChange, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  window.removeEventListener('resize', onWindowChange)
  window.removeEventListener('scroll', onWindowChange, true)
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
  <section
    ref="rootEl"
    class="ticket-stub flex-col p-5 sm:p-7 gap-4"
  >
    <p class="font-ticket text-xs text-neutral-400 dark:text-neutral-500">
      Hızlı arama
    </p>

    <div class="flex flex-col sm:flex-row gap-3">
      <div
        ref="inputWrapEl"
        class="relative w-full flex-1"
      >
        <UInput
          :id="inputId"
          v-model="keyword"
          icon="i-lucide-search"
          size="lg"
          placeholder="Sanatçı, etkinlik veya mekan adı"
          class="w-full"
          role="combobox"
          :aria-expanded="showPanel"
          aria-autocomplete="list"
          :aria-controls="listboxId"
          :aria-activedescendant="activeOptionId"
          @focus="open = keyword.trim().length >= QUICK_SEARCH_MIN_CHARS"
          @keydown="onInputKeydown"
        />
      </div>

      <UButton
        color="primary"
        size="lg"
        icon="i-lucide-compass"
        class="sm:flex-none hover:brightness-110"
        @click="submitSearch"
      >
        Keşfet
      </UButton>
    </div>
  </section>

  <Teleport to="body">
    <div
      v-if="showPanel"
      :id="listboxId"
      ref="panelEl"
      role="listbox"
      class="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
      :style="panelStyle"
    >
      <div
        v-if="searching"
        class="flex items-center gap-2 px-3 py-3 text-sm text-neutral-500 dark:text-neutral-400"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-4 animate-spin"
        />
        Aranıyor...
      </div>

      <ul
        v-else-if="results.length"
        class="max-h-72 overflow-y-auto py-1"
      >
        <li
          v-for="(item, index) in results"
          :id="item.id"
          :key="item.id"
          role="option"
          :aria-selected="index === activeIndex"
        >
          <button
            type="button"
            class="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors"
            :class="index === activeIndex
              ? 'bg-neutral-100 dark:bg-neutral-800'
              : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/70'"
            @mouseenter="activeIndex = index"
            @click="goToResult(item)"
          >
            <div class="size-9 flex-none overflow-hidden rounded bg-neutral-200 dark:bg-neutral-800">
              <img
                v-if="item.image"
                :src="item.image"
                :alt="item.name"
                class="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              >
              <div
                v-else
                class="flex h-full w-full items-center justify-center text-neutral-400"
              >
                <UIcon
                  :name="item.icon"
                  class="size-4"
                />
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {{ item.name }}
              </p>
              <p class="truncate text-xs text-neutral-500 dark:text-neutral-400">
                {{ item.subtitle }}
              </p>
            </div>
            <UIcon
              :name="item.icon"
              class="size-3.5 flex-none text-neutral-400"
            />
          </button>
        </li>
      </ul>

      <div
        v-else-if="showEmpty || searchError"
        class="px-3 py-3 text-sm text-neutral-500 dark:text-neutral-400"
      >
        Sonuç bulunamadı
      </div>

      <div class="border-t border-neutral-200 dark:border-neutral-700">
        <button
          type="button"
          class="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-[#E8432E] hover:bg-neutral-50 dark:hover:bg-neutral-800/70"
          @click="submitSearch"
        >
          <span class="truncate">{{ seeAllLabel }}</span>
          <UIcon
            name="i-lucide-arrow-right"
            class="size-4 flex-none"
          />
        </button>
      </div>
    </div>
  </Teleport>
</template>
