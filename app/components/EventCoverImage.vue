<script setup lang="ts">
import {
  EVENT_IMAGE_PLACEHOLDER,
  isSoftCoverImage,
  isSourceTicketmasterImage,
  toOptimizedImageUrl
} from '#shared/utils/event'

const props = withDefaults(defineProps<{
  src?: string | null
  alt: string
  /** card: soft → blur + contain; hero: SOURCE → placeholder, diğerleri yüksek çözünürlük */
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

const optimizedSrc = computed(() => {
  if (showPlaceholder.value) {
    return EVENT_IMAGE_PLACEHOLDER
  }
  return toOptimizedImageUrl(props.src || undefined, { forHero: props.mode === 'hero' })
    || props.src
    || EVENT_IMAGE_PLACEHOLDER
})

/** Kartta optimize sonrası hâlâ yumuşaksa blur çerçeve */
const useBlurFrame = computed(() =>
  props.mode === 'card'
  && !showPlaceholder.value
  && (isSource.value || isSoftCoverImage(optimizedSrc.value))
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
    <!-- Soft / SOURCE kart: koyu bulanık dolgu + net contain -->
    <template v-if="useBlurFrame">
      <img
        :src="optimizedSrc"
        alt=""
        aria-hidden="true"
        class="absolute inset-0 h-full w-full scale-125 object-cover blur-2xl brightness-[0.4] saturate-75"
        loading="lazy"
        decoding="async"
      >
      <div class="absolute inset-0 bg-black/40" />
      <img
        :src="optimizedSrc"
        :alt="alt"
        class="relative z-[1] h-full w-full object-contain object-center transition-transform duration-500 group-hover:scale-[1.02]"
        :loading="eager ? 'eager' : 'lazy'"
        decoding="async"
        @error="onError"
      >
    </template>

    <!-- Yüksek çözünürlüklü 16:9 / Universe 2K+: cover -->
    <img
      v-else
      :src="optimizedSrc"
      :alt="alt"
      class="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="eager ? 'high' : undefined"
      decoding="async"
      @error="onError"
    >
  </div>
</template>
