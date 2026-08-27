<script setup lang="ts">
import { EVENT_IMAGE_PLACEHOLDER, isSourceTicketmasterImage } from '#shared/utils/event'

const props = withDefaults(defineProps<{
  src?: string | null
  alt: string
  /** card: SOURCE → blur + contain; hero: SOURCE → placeholder */
  mode?: 'card' | 'hero'
  eager?: boolean
}>(), {
  mode: 'card',
  eager: false
})

const broken = ref(false)

const isSource = computed(() => isSourceTicketmasterImage(props.src))

/** Detay hero’da SOURCE büyük alana yetmez → Evently placeholder */
const showPlaceholder = computed(() =>
  broken.value
  || !props.src
  || props.src === EVENT_IMAGE_PLACEHOLDER
  || (props.mode === 'hero' && isSource.value)
)

const displaySrc = computed(() =>
  showPlaceholder.value ? EVENT_IMAGE_PLACEHOLDER : (props.src as string)
)

const useBlurFrame = computed(() =>
  props.mode === 'card' && isSource.value && !showPlaceholder.value
)

function onError() {
  broken.value = true
}

watch(() => props.src, () => {
  broken.value = false
})
</script>

<template>
  <div class="absolute inset-0 overflow-hidden bg-neutral-900">
    <!-- SOURCE kart: koyu bulanık dolgu -->
    <template v-if="useBlurFrame">
      <img
        :src="displaySrc"
        alt=""
        aria-hidden="true"
        class="absolute inset-0 h-full w-full scale-110 object-cover blur-xl brightness-[0.35] saturate-75"
        loading="lazy"
        decoding="async"
      >
      <div class="absolute inset-0 bg-black/35" />
      <img
        :src="displaySrc"
        :alt="alt"
        class="relative z-[1] h-full w-full object-contain object-center transition-transform duration-500 group-hover:scale-105"
        :loading="eager ? 'eager' : 'lazy'"
        decoding="async"
        @error="onError"
      >
    </template>

    <!-- 16:9 / normal: cover -->
    <img
      v-else
      :src="displaySrc"
      :alt="alt"
      class="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="eager ? 'high' : undefined"
      decoding="async"
      @error="onError"
    >
  </div>
</template>
