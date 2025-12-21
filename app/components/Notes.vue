<script setup lang="ts">
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

  <UModal fullscreen title="Onze notities">
    <UButton icon="mdi:note" size="xl" color="secondary"
      class="cursor-pointer hover:scale-105 hover:rotate-3 transition-transform duration-500">8 notities verzameld
    </UButton>

    <template #body>
      <div class="flex items-center justify-center p-4 text-center flex-1" v-if="notes.length < 1">
        <div class="text-2xl">
          Sleep bestanden hierheen, neem een audio bericht op, of verbind een ander apparaat.
        </div>

      </div>

      <UPageColumns>

        <UPageCard v-for="(note, index) in notes" :key="index" variant="solid"
          :class="{ 'bg-primary': note.type === 'audio', 'bg-secondary': note.type === 'pdf' }">
          <div class="text-5xl">
            <UIcon v-if="note.type === 'audio'" name="mdi:microphone" size="lg" />
            <UIcon v-else-if="note.type === 'pdf'" name="mdi:file-pdf" size="lg" />
            <UIcon v-else name="mdi:note" size="lg" />
          </div>

          <div class="font-bold text-lg">{{ note.title }}</div>
          <div>{{ note.description }}</div>
        </UPageCard>
      </UPageColumns>

    </template>
  </UModal>


</template>
