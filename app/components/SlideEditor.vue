<script setup lang="ts">
import * as v from 'valibot'
import type { FormSubmitEvent } from '#ui/types'

const sessionsStore = useSessionsStore()
const isOpen = ref(false)
const isLoading = ref(false)

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

watchEffect(() => {
  if (isOpen.value && sessionsStore.currentSession?.slides) {
    const slide = sessionsStore.currentSession.slides[sessionsStore.activeSlideIndex]
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

  isLoading.value = true
  const slides = [...sessionsStore.currentSession.slides]
  slides[sessionsStore.activeSlideIndex] = {
    ...slides[sessionsStore.activeSlideIndex],
    ...event.data,
    duration: event.data.duration || 0,
    agentInstructions: event.data.agentInstructions || '',
    facilitatorNotes: event.data.facilitatorNotes || ''
  }

  await sessionsStore.updateSession(sessionsStore.currentSession.id, { slides })
  isLoading.value = false
  isOpen.value = false
}

async function deleteSlide() {
  if (!sessionsStore.currentSession?.id) return

  isLoading.value = true
  const slides = [...sessionsStore.currentSession.slides]
  slides.splice(sessionsStore.activeSlideIndex, 1)

  if (sessionsStore.activeSlideIndex >= slides.length && sessionsStore.activeSlideIndex > 0) {
    sessionsStore.activeSlideIndex--
  }

  await sessionsStore.updateSession(sessionsStore.currentSession.id, { slides })
  isLoading.value = false
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
          <UButton color="neutral" variant="ghost" @click="isOpen = false">Annuleren</UButton>
          <UButton icon="mdi:check" type="submit" form="slide-form" :loading="isLoading">Bewaar</UButton>
        </div>
      </div>
    </template>

    <template #body>
      <UContainer>


        <UForm id="slide-form" :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField label="Titel" name="title">
            <UInput v-model="state.title" class="w-full" placeholder="Brainstorm strategie..." />
          </UFormField>
          <UFormField label="Tijd (minuten)" name="duration">
            <UInput v-model.number="state.duration" type="number" class="w-full" placeholder="10" icon="mdi-clock" />
          </UFormField>
          <UFormField label="Instructies voor AI" name="agentInstructions"
            description="Gebruik markdown voor formatting (# Titel, *bold*)">
            <UTextarea v-model="state.agentInstructions" class="w-full" autoresize
              placeholder="Je bent een ervaren campagnestrateeg die..." :rows="12" />
          </UFormField>
          <UFormField label="Notities voor facilitator" name="facilitatorNotes">
            <UTextarea v-model="state.facilitatorNotes" class="w-full" autoresize placeholder="Facilitator notities..."
              :rows="4" />
          </UFormField>

          <UButton icon="mdi:bin" color="error" @click="deleteSlide" :loading="isLoading">Verwijder slide</UButton>

        </UForm>


      </UContainer>
    </template>
  </UModal>
</template>
