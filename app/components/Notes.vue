<script setup lang="ts">
import type { SessionNote } from '~/stores/notes';
import JSZip from 'jszip';

const isOpen = ref(false)
const notesStore = useNotesStore()

const selectedNote = ref<SessionNote | null>(null)
const isDetailsOpen = ref(false)

function openNoteDetails(note: SessionNote) {
  selectedNote.value = note
  isDetailsOpen.value = true
}

function getIconForNoteType(type: string | undefined) {
  switch (type) {
    case 'audio':
      return 'mdi:microphone';
    case 'pdf':
      return 'mdi:file-pdf';
    default:
      return 'mdi:note';
  }
}

async function downloadSingleNote(note: SessionNote) {
  const safeTitle = (note.title || 'note')
    .replace(/[^a-z0-9\s-]/gi, '')
    .trim()
    .replace(/\s+/g, '-')

  // Download metadata
  const textContent = `Titel: ${note.emoji ? note.emoji + ' ' : ''}${note.title || 'Geen titel'}
Samenvatting: ${note.summary || 'Geen samenvatting'}

Volledige tekst:
${note.fullText || 'Geen tekstinhoud beschikbaar'}
`
  const textBlob = new Blob([textContent], { type: 'text/plain' })
  const textUrl = URL.createObjectURL(textBlob)
  const textLink = document.createElement('a')
  textLink.href = textUrl
  textLink.download = `${safeTitle}-metadata.txt`
  document.body.appendChild(textLink)
  textLink.click()
  document.body.removeChild(textLink)
  URL.revokeObjectURL(textUrl)

  // Download original file
  if (note.file?.url) {
    try {
      const response = await fetch(note.file.url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      let extension = 'bin'
      if (note.file.type === 'pdf') extension = 'pdf'
      else if (note.file.type === 'audio') extension = 'mp3'
      else if (note.file.type === 'image') extension = 'jpg'

      // Try to get extension from storagePath if possible
      const pathParts = note.file.storagePath.split('.')
      if (pathParts.length > 1) {
        extension = pathParts.pop() || extension
      }

      link.download = `${safeTitle}.${extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Download failed, opening in new tab', e)
      window.open(note.file.url, '_blank')
    }
  }
}

async function downloadNote() {
  if (!selectedNote.value) return
  await downloadSingleNote(selectedNote.value)
}

async function downloadAllNotes() {
  const zip = new JSZip()
  const folder = zip.folder("notes")

  if (!folder) return

  // Show some loading state if possible, but for now just process
  for (const note of notesStore.notes) {
    const safeTitle = (note.title || 'note')
      .replace(/[^a-z0-9\s-]/gi, '')
      .trim()
      .replace(/\s+/g, '-')

    // Add metadata
    const textContent = `Titel: ${note.emoji ? note.emoji + ' ' : ''}${note.title || 'Geen titel'}
Samenvatting: ${note.summary || 'Geen samenvatting'}

Volledige tekst:
${note.fullText || 'Geen tekstinhoud beschikbaar'}
`
    folder.file(`${safeTitle}-metadata.txt`, textContent)

    // Add original file
    if (note.file?.url) {
      try {
        const response = await fetch(note.file.url)
        const blob = await response.blob()

        let extension = 'bin'
        if (note.file.type === 'pdf') extension = 'pdf'
        else if (note.file.type === 'audio') extension = 'mp3'
        else if (note.file.type === 'image') extension = 'jpg'

        const pathParts = note.file.storagePath.split('.')
        if (pathParts.length > 1) {
          extension = pathParts.pop() || extension
        }

        folder.file(`${safeTitle}.${extension}`, blob)
      } catch (e) {
        console.error(`Failed to download file for note: ${note.title}`, e)
      }
    }
  }

  const content = await zip.generateAsync({ type: "blob" })
  const url = URL.createObjectURL(content)
  const link = document.createElement('a')
  link.href = url
  link.download = "notes.zip"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
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
          <UButton icon="mdi:download" size="xl" color="secondary" variant="ghost" @click="downloadAllNotes">Download
            alles</UButton>
          <UButton icon="mdi:upload" size="xl" color="secondary" variant="soft">Upload bestanden</UButton>
          <UButton icon="mdi:close" @click="isOpen = false" class="rounded-full" color="secondary" size="xl"></UButton>
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

        <UPageCard v-for="(note, index) in notesStore.notes" :key="index"
          class="bg-white cursor-pointer hover:scale-95 hover:-rotate-1 active:scale-90 transition-all duration-300"
          :class="{ 'bg-primary-300 hover:bg-primary-400': note.file?.type === 'audio', 'bg-secondary-300 hover:bg-secondary-400': note.file?.type === 'pdf' }"
          variant="soft" @click="openNoteDetails(note)">
          <div class="space-y-2">

            <div class="space-y-2 text-secondary-900"
              :class="{ 'text-primary-900!': note.file?.type === 'audio', 'text-secondary-900!': note.file?.type === 'pdf' }">
              <div class="flex items-start justify-between">
                <div class="text-5xl">
                  <UIcon :name="getIconForNoteType(note.file?.type)" size="lg" />
                </div>
              </div>


              <div class="font-bold text-3xl">
                {{ note.emoji }} {{ note.title }}
              </div>

            </div>

            <div v-if="note.summary">{{ note.summary }}</div>

          </div>

        </UPageCard>
      </UPageColumns>

      <UModal v-model:open="isDetailsOpen" fullscreen :ui="{ content: 'bg-primary-100', header: 'border-primary-200' }">
        <template #header>
          <div class="flex justify-between w-full items-center">
            <h2 class="font-bold text-xl flex items-center gap-2">
              <UIcon :name="getIconForNoteType(selectedNote?.file?.type)" size="lg" />
              <span v-if="selectedNote?.file?.type === 'audio'">Audio</span>
            </h2>
            <div class="flex gap-2">
              <UButton v-if="selectedNote?.file?.url" @click="downloadNote" icon="mdi:download" variant="soft"
                size="xl">
                Download
              </UButton>
              <UButton icon="mdi:close" @click="isDetailsOpen = false" class="rounded-full" color="primary" size="xl">
              </UButton>
            </div>

          </div>
        </template>

        <template #body>

          <div class="space-y-6" v-if="selectedNote">

            <div class="flex items-center justify-between">
              <!-- <UBadge
                :color="selectedNote.file?.type === 'audio' ? 'primary' : selectedNote.file?.type === 'pdf' ? 'secondary' : 'neutral'"
                variant="subtle">
                {{ selectedNote.file?.type === 'audio' ? 'Audio Note' : selectedNote.file?.type === 'pdf' ? 'PDF
                Document' : 'Note' }}
              </UBadge> -->


            </div>

            <div>
              <h2 class="font-bold text-6xl">{{ selectedNote.emoji }} {{ selectedNote.title }}</h2>
            </div>

            <div v-if="selectedNote.summary" class="text-4xl">
              {{ selectedNote.summary }}
            </div>

            <UCard ariant="outline" :ui="{ root: 'ring-primary-300! ring-4' }">
              <audio v-if="selectedNote.file?.url && selectedNote.file?.type === 'audio'" controls
                :src="selectedNote.file.url" class="w-full"></audio>
            </UCard>


            <UCard class="text-2xl">
              <h3 class="font-bold mb-2 text-gray-900">
                <span v-if="selectedNote.file?.type === 'audio'">Transcript</span>
                <span v-else>Volledige tekst</span>
              </h3>
              <div v-if="selectedNote.fullText">
                {{ selectedNote.fullText }}
              </div>
              <div v-else class="text-gray-500 italic">
                Geen transcript beschikbaar
              </div>
            </UCard>
          </div>
        </template>
      </UModal>

    </template>
  </UModal>


</template>
