<script setup lang="ts">
export interface Section {
  emoji: string
  title: string
  description: string
}

defineProps<{
  responses: [
    {
      sections: Section[]
    }
  ] | null
}>()

const isOpen = ref(false)
const selectedSection = ref<Section | null>(null)

function openSection(section: Section) {
  selectedSection.value = section
  isOpen.value = true
}
</script>

<template>
  <div v-if="!responses?.length || !responses[responses.length - 1]?.sections?.length"
    class="h-full flex items-center justify-center">
    <div class="flex items-baseline leading-none pt-4 text-7xl">
      <span class="font-bold">Power</span>
      <div class="flex flex-col ml-1">
        <s class="text-red-500 font-bold">Point</s>
        <i class="font-[Comic_Sans_MS] -rotate-5 -translate-8 text-primary">Brainstorm</i>
        <i class="font-[Comic_Sans_MS] -rotate-5 -translate-8 text-primary text-xs">(minder scherm, meer
          groepsgesprek)</i>

      </div>
    </div>

  </div>
  <div class="grid grid-cols-2 grid-rows-2 h-full w-full gap-4" v-else>

    <UCard v-for="(section, index) in responses[responses.length - 1]?.sections" :key="index"
      class="w-full h-full flex flex-col justify-center items-center cursor-pointer shadow hover:scale-105 hover:-rotate-2 hover:shadow-2xl transition-all"
      @click="openSection(section)">
      <div class="text-center space-y-4">
        <div class="text-5xl">{{ section.emoji }}</div>
        <p class="text-2xl font-bold">{{ section.title }}</p>
      </div>
    </UCard>

    <UModal v-model:open="isOpen" fullscreen close-icon="mdi:close">
      <template #content>
        <UButton icon="mdi:close" color="neutral" variant="solid" class="fixed top-8 right-8 rounded-full" size="xl"
          @click="isOpen = false" />
        <div class="p-8 flex gap-4 flex-wrap content-center h-full overflow-y-scroll top-0">
          <div class="text-8xl">{{ selectedSection?.emoji }}</div>
          <h2 class="text-6xl font-bold mb-6">{{ selectedSection?.title }}</h2>
          <p class="text-2xl">{{ selectedSection?.description }}</p>
        </div>
      </template>
    </UModal>
  </div>
</template>
