<script setup lang="ts">
import * as v from 'valibot'
import type { FormSubmitEvent } from '#ui/types'

const sessionsStore = useSessionsStore()
const isOpen = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)

const schema = v.object({
  title: v.pipe(v.string(), v.minLength(1, 'Titel is verplicht')),
  duration: v.optional(v.number("Vul het aantal minuten in.")),
  agentInstructions: v.optional(v.string()),
  facilitatorNotes: v.optional(v.string())
})

type Schema = v.InferOutput<typeof schema>

const state = reactive({
  title: '',
  duration: 0,
  agentInstructions: '',
  facilitatorNotes: ''
})

function open() {
  isOpen.value = true
}

defineExpose({
  open
})

const route = useRoute()

watchEffect(() => {
  if (isOpen.value && sessionsStore.currentSession?.slides) {
    const slide = sessionsStore.currentSession.slides.find(s => s.id === route.params.slideID)
    if (slide) {
      state.title = slide.title
      state.duration = slide.duration || 0
      state.agentInstructions = slide.agentInstructions || ''
      state.facilitatorNotes = slide.facilitatorNotes || ''
    }
  }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!sessionsStore.currentSession?.id) return

  isSaving.value = true
  const slides = [...sessionsStore.currentSession.slides]
  const index = slides.findIndex(s => s.id === route.params.slideID)

  if (index !== -1) {
    const currentSlide = slides[index]
    if (currentSlide) {
      slides[index] = {
        ...currentSlide,
        ...event.data,
        id: currentSlide.id,
        duration: event.data.duration || 0,
        agentInstructions: event.data.agentInstructions || '',
        facilitatorNotes: event.data.facilitatorNotes || ''
      }

      await sessionsStore.updateSession(sessionsStore.currentSession.id, { slides })
    }
  }
  isSaving.value = false
  isOpen.value = false
}

async function deleteSlide() {
  if (!sessionsStore.currentSession?.id) return

  isDeleting.value = true
  const slides = [...sessionsStore.currentSession.slides]
  const index = slides.findIndex(s => s.id === route.params.slideID)

  if (index !== -1) {
    slides.splice(index, 1)

    let newActiveIndex = index
    if (newActiveIndex >= slides.length && newActiveIndex > 0) {
      newActiveIndex--
    }

    await sessionsStore.updateSession(sessionsStore.currentSession.id, { slides })

    if (slides.length > 0) {
      const newSlide = slides[newActiveIndex]
      if (newSlide) {
        await navigateTo(`/session/${sessionsStore.currentSession.id}/${newSlide.id}`)
      }
    } else {
      await navigateTo(`/`)
    }
  }

  isDeleting.value = false
  isOpen.value = false
}
</script>

<template>
  <UModal fullscreen v-model:open="isOpen">
    <UButton icon="mdi:edit" color="secondary" variant="outline">Bewerk slide</UButton>

    <template #header>
      <div class="flex items-center justify-between w-full">
        <h2 class="font-bold">Bewerk slide</h2>

        <div class="flex items-center gap-2">
          <UButton color="neutral" variant="ghost" @click="isOpen = false" size="xl">Annuleren</UButton>
          <UButton icon="mdi:check" type="submit" form="slide-form" :loading="isSaving" size="xl">Bewaar</UButton>
        </div>
      </div>
    </template>

    <template #body>
      <UContainer>


        <UForm id="slide-form" :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <div class="flex gap-4">
            <UFormField label="Titel" name="title" size="xl" class="flex-1">
              <UInput v-model="state.title" class="w-full" placeholder="Brainstorm strategie..." />
            </UFormField>
            <UFormField label="Tijd (minuten)" name="duration" size="xl" class="flex-1">
              <UInput v-model.number="state.duration" type="number" class="w-full" placeholder="10" icon="mdi-clock" />
            </UFormField>
          </div>

          <UFormField label="Instructies voor AI" name="agentInstructions" size="xl"
            description="Gebruik markdown voor formatting (# Titel, *bold*)">
            <UTextarea v-model="state.agentInstructions" class="w-full" autoresize
              placeholder="Je bent een ervaren campagnestrateeg die..." :rows="12" />
          </UFormField>
          <UFormField label="Notities voor facilitator" name="facilitatorNotes" size="xl">
            <UTextarea v-model="state.facilitatorNotes" class="w-full" autoresize placeholder="Facilitator notities..."
              :rows="4" />
          </UFormField>

          <UButton icon="mdi:bin" color="error" @click="deleteSlide" :loading="isDeleting">Verwijder slide</UButton>

        </UForm>


      </UContainer>
    </template>
  </UModal>
</template>
