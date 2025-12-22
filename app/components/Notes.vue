<script setup lang="ts">
const isOpen = ref(false)
const notes = ref([
  {
    title: 'Notitie 1',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    type: 'text'
  },
  {
    title: 'Audionotitie',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    type: 'audio'
  },
  {
    title: 'PDF',
    description: 'Lorem ipsum dolor sit amet.',
    type: 'pdf'
  },
  {
    title: 'Audionotitie',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Consectetur adipiscing elit.',
    type: 'audio'
  },
  {
    title: 'Audionotitie',
    description: 'Lorem ipsum dolor sit amet.',
    type: 'audio'
  },
  {
    title: 'PDF',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    type: 'pdf'
  },
  {
    title: 'Audionotitie',
    description: 'Lorem ipsum dolor sit amet.',
    type: 'audio'
  },
  {
    title: 'Audionotitie',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    type: 'audio'
  },

])
</script>


<template>

  <UModal fullscreen title="Onze notities" description="Al onze verzamelde notities" v-model:open="isOpen"
    :ui="{ content: 'bg-secondary-100', header: 'border-secondary-200' }">
    <UButton icon="mdi:note" size="xl" color="secondary"
      class="cursor-pointer hover:scale-105 hover:-rotate-3 transition-transform duration-500">8 notities verzameld
    </UButton>

    <template #header>
      <div class="flex justify-between w-full items-center">
        <h2 class="font-bold">Onze notities</h2>
        <div class="flex items-center gap-2">
          <UButton icon="mdi:upload" size="xl" color="secondary">Upload bestanden</UButton>
          <UButton icon="mdi:close" @click="isOpen = false" class="rounded-full" variant="ghost" color="neutral"
            size="xl"></UButton>
        </div>

      </div>
    </template>

    <template #body>
      <div class="flex items-center justify-center p-4 text-center flex-1" v-if="notes.length < 1">
        <div class="text-2xl">
          Sleep bestanden hierheen, neem een audio bericht op, of verbind een ander apparaat.
        </div>

      </div>

      <UPageColumns>

        <UPageCard v-for="(note, index) in notes" :key="index" class="bg-white"
          :class="{ 'bg-primary-300': note.type === 'audio', 'bg-secondary-300': note.type === 'pdf' }" variant="soft">
          <div class="space-y-2">

            <div class="space-y-2 text-secondary-900"
              :class="{ 'text-primary-900!': note.type === 'audio', 'text-secondary-900!': note.type === 'pdf' }">
              <div class="text-5xl">
                <UIcon v-if="note.type === 'audio'" name="mdi:microphone" size="lg" />
                <UIcon v-else-if="note.type === 'pdf'" name="mdi:file-pdf" size="lg" />
                <UIcon v-else name="mdi:note" size="lg" />
              </div>

              <div class="font-bold text-3xl">{{
                note.title }}</div>

            </div>

            <div>{{ note.description }}</div>

          </div>

        </UPageCard>
      </UPageColumns>

    </template>
  </UModal>


</template>
