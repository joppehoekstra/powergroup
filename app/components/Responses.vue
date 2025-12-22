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
  hideResponses: boolean
}>()

const emit = defineEmits(['showResponses'])

const isOpen = ref(false)
const selectedSection = ref<Section | null>(null)

function openSection(section: Section) {
  selectedSection.value = section
  isOpen.value = true
}
</script>

<template>
  <div v-if="responses && responses.length > 0 && !hideResponses" class="flex-1 min-h-0 flex flex-col -mb-4 px-4">
    <!--
    arrows
    :prev="{ variant: 'solid', class: 'disabled:opacity-10! cursor-pointer' }"
      :next="{ variant: 'solid', class: 'disabled:opacity-10 cursor-pointer' }"
       -->
    <UCarousel v-slot="{ item }" wheel-gestures :items="responses" :startIndex="responses.length - 1"
      class="h-full flex-1 flex flex-col" :ui="{
        root: 'h-full flex-1 flex flex-col',
        viewport: 'h-full flex-1 overflow-visible',
        container: 'h-full !mt-0',
        item: 'h-full !basis-full !pt-0 w-full !pb-4',

      }" orientation="vertical">
      <div class=" grid grid-cols-2 grid-rows-2 h-full w-full gap-4">
        <UCard v-for="(section, index) in item.sections" :key="index"
          class="w-full h-full flex flex-col justify-center items-center cursor-pointer hover:scale-105 hover:-rotate-2 active:scale-120 hover:shadow-2xl hover:z-30! transition-all bg-primary-200 shadow-none duration-300"
          variant="soft" @click="openSection(section)">
          <div class="text-center space-y-4">
            <div class="text-5xl">{{ section.emoji }}</div>
            <p class="text-2xl font-bold text-primary-900">{{ section.title }}</p>
          </div>
        </UCard>

        <UModal v-model:open="isOpen" fullscreen close-icon="mdi:close" :ui="{ content: 'bg-primary-100' }">
          <template #content>
            <UButton icon="mdi:close" color="primary" variant="solid" class="fixed top-8 right-8 rounded-full" size="xl"
              @click="isOpen = false" />
            <div class="p-8 flex gap-4 flex-wrap content-center h-full overflow-y-scroll top-0">
              <div class="text-8xl">{{ selectedSection?.emoji }}</div>
              <h2 class="text-6xl font-bold mb-6 text-primary-900">{{ selectedSection?.title }}</h2>
              <p class="text-2xl">{{ selectedSection?.description }}</p>
            </div>
          </template>
        </UModal>
      </div>
    </UCarousel>
  </div>

  <div v-else-if="hideResponses" class="flex-1 min-h-0 flex content-center justify-center flex-wrap gap-4">
    <div class="w-full">
      <h1 class="text-6xl max-w-2xl m-auto">Start een groep huddle om deze slide te vullen!</h1>

    </div>
    <UButton variant="outline" @click="emit('showResponses')">Toon vorige AI antwoorden</UButton>


  </div>

  <div v-else class="flex-1 min-h-0 flex items-center justify-center">
    <div class="flex items-baseline leading-none pt-4 text-7xl">
      <span class="font-bold">Power</span>
      <div class="flex flex-col ml-1">
        <s class="text-secondary font-bold">Point</s>
        <i class="font-[Comic_Sans_MS] -rotate-5 -translate-4 text-primary text-5xl">Brainstorm</i>
        <i class="font-[Comic_Sans_MS] -rotate-5 -translate-4 text-primary text-sm">(minder scherm, meer
          groepsgesprek)</i>

      </div>
    </div>

  </div>



</template>
