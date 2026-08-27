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
  /** card/hero: Universe & SOURCE → blur + contain; hero’da yalnızca TM _SOURCE → placeholder */
  mode?: 'card' | 'hero'
  eager?: boolean
}>(), {
  mode: 'card',
  eager: false
})

const broken = ref(false)

const isUniverse = computed(() => /images\.universe\.com/i.test(props.src || ''))
const isSource = computed(() => isSourceTicketmasterImage(props.src))

/** Detay hero’da Ticketmaster _SOURCE büyük alana yetmez → placeholder (Universe blur+contain alır) */
const showPlaceholder = computed(() =>
  broken.value
  || !props.src
  || props.src === EVENT_IMAGE_PLACEHOLDER
  || (props.mode === 'hero' && isSource.value && !isUniverse.value)
)

const optimizedSrc = computed(() => {
  if (showPlaceholder.value) {
    return EVENT_IMAGE_PLACEHOLDER
  }
  return toOptimizedImageUrl(props.src || undefined, { forHero: props.mode === 'hero' })
    || props.src
    || EVENT_IMAGE_PLACEHOLDER
})

/** Universe / SOURCE / soft: bulanık arka plan + contain */
const useBlurFrame = computed(() =>
  !showPlaceholder.value
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
    <!-- Soft / Universe / SOURCE: koyu bulanık dolgu + net contain -->
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

    <!-- Yüksek çözünürlüklü 16:9: cover -->
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
