<script setup lang="ts">
defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'submit': []
}>()
</script>

<template>
  <UFormField
    name="keyword"
    label="Etkinlik ara"
    class="w-full"
  >
    <UInput
      :model-value="modelValue"
      icon="i-lucide-search"
      size="lg"
      placeholder="Sanatçı, etkinlik veya mekan adı"
      class="w-full"
      @update:model-value="emit('update:modelValue', String($event ?? ''))"
      @keydown.enter.prevent="emit('submit')"
    />
  </UFormField>
</template>
