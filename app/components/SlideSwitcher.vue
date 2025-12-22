<script setup lang="ts">
import { colors } from '~/utils/colors'

const route = useRoute()
const sessionID = route.params.sessionID as string
const sessionsStore = useSessionsStore()

const isAddingSlide = ref(false)

const addSlide = async () => {
  if (!sessionsStore.currentSession?.id) return
  isAddingSlide.value = true

  try {
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    const newSlide = {
      id: crypto.randomUUID(),
      title: 'Nieuwe slide',
      duration: 10,
      agentInstructions: '',
      facilitatorNotes: '',
      color: randomColor
    }

    const slides = [...(sessionsStore.currentSession.slides || []), newSlide]

    await sessionsStore.updateSession(sessionsStore.currentSession.id, { slides })
    navigateTo(`/session/${sessionID}/${newSlide.id}`)
  } finally {
    isAddingSlide.value = false
  }
}
</script>

<template>
  <div class="flex gap-1 text-xs  z-10 backdrop-blur-sm bg-primary-100/50 p-4 pt-0">
    <UButton size="xs" v-for="(slide, index) in sessionsStore.currentSession?.slides" :key="slide.id" block
      :variant="slide.id === route.params.slideID ? 'solid' : 'soft'" color="primary"
      class="rounded-full cursor-pointer" :to="{
        name: 'SessionSlide',
        params: { sessionID, slideID: slide.id }
      }">
      {{ slide.title }}
    </UButton>
    <UButton icon="mdi:plus" :loading="isAddingSlide" color="primary" size="xs" class="rounded-full" @click="addSlide">
    </UButton>
  </div>
</template>
