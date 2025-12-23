<script setup lang="ts">
import type { de } from '@nuxt/ui/runtime/locale/index.js';

const isOpen = ref(false)
const notesStore = useNotesStore()
</script>


<template>

  <UModal fullscreen title="Onze notities" description="Al onze verzamelde notities" v-model:open="isOpen"
    :ui="{ content: 'bg-secondary-100', header: 'border-secondary-200' }">
    <UButton icon="mdi:note" size="xl" color="secondary"
      class="cursor-pointer hover:scale-105 hover:-rotate-3 transition-transform duration-500">{{
        notesStore.notes.length }} notities verzameld
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
      <div class="flex items-center justify-center p-4 text-center flex-1" v-if="notesStore.notes.length < 1">
        <div class="text-2xl">
          Sleep bestanden hierheen, neem een audio bericht op, of verbind een ander apparaat.
        </div>

      </div>

      <UPageColumns>

        <UPageCard v-for="(note, index) in notesStore.notes" :key="index" class="bg-white"
          :class="{ 'bg-primary-300': note.file?.type === 'audio', 'bg-secondary-300': note.file?.type === 'pdf' }"
          variant="soft">
          <div class="space-y-2">

            <div class="space-y-2 text-secondary-900"
              :class="{ 'text-primary-900!': note.file?.type === 'audio', 'text-secondary-900!': note.file?.type === 'pdf' }">
              <div class="flex items-start justify-between">
                <div class="text-5xl">
                  <UIcon v-if="note.file?.type === 'audio'" name="mdi:microphone" size="lg" />
                  <UIcon v-else-if="note.file?.type === 'pdf'" name="mdi:file-pdf" size="lg" />
                  <UIcon v-else name="mdi:note" size="lg" />
                </div>
                <UButton v-if="note.file?.url" :to="note.file.url" target="_blank" icon="mdi:download" variant="link"
                  size="xs">
                  Download
                </UButton>
              </div>


              <div class="font-bold text-3xl">{{
                note.title }}</div>

            </div>

            <audio v-if="note.file?.url && note.file?.type === 'audio'" controls :src="note.file.url"
              class="w-full"></audio>


            <div v-if="note.summary">{{ note.summary }}</div>
            <UAccordion :items="[{
              label: 'Transcript',
              content: note.fullText || 'Geen transcript beschikbaar'
            }]" class="-my-2" :ui="{
              label: 'font-bold'
            }" />

          </div>

        </UPageCard>
      </UPageColumns>

    </template>
  </UModal>


</template>
