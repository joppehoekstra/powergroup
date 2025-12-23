<script setup lang="ts">
import { colors } from '~/utils/colors'

definePageMeta({
  name: 'SessionSlide',
})

const route = useRoute()
const sessionID = route.params.sessionID as string
const sessionsStore = useSessionsStore()
const responsesStore = useResponsesStore()
const notesStore = useNotesStore()

const formattedDate = computed(() => {
  if (!sessionsStore.currentSession?.scheduledAt) return ''
  const date = sessionsStore.currentSession.scheduledAt.toDate()
  return new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
})

const currentSlide = computed(() => {
  if (!sessionsStore.currentSession?.slides) return null
  return sessionsStore.currentSession.slides.find(s => s.id === route.params.slideID)
})


watch(() => route.params.slideID, (newId) => {
  if (newId) {
    responsesStore.subscribeToResponses(sessionID, newId as string)
  }
}, { immediate: true })

const appConfig = useAppConfig()

watch(() => currentSlide.value?.color, (newColor) => {
  if (newColor) {
    appConfig.ui.colors.primary = newColor
    const index = colors.indexOf(newColor)
    if (index !== -1) {
      const secondaryIndex = (index + Math.floor(colors.length / 2)) % colors.length
      const secondaryColor = colors[secondaryIndex]
      if (secondaryColor) {
        appConfig.ui.colors.secondary = secondaryColor
      }
    }
  }
}, { immediate: true })

const isFullscreen = ref(false)

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
      isFullscreen.value = false
    }
  }
}

onMounted(() => {
  sessionsStore.subscribeToSession(sessionID)
  notesStore.subscribeToSessionNotes(sessionID)

  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

watch(() => sessionsStore.currentSession, (session) => {
  // Session loaded
})
</script>

<template>
  <div class="flex flex-col h-full w-full fixed top-0 bg-primary-100">

    <div class="flex items-center justify-between gap-4 z-10 backdrop-blur-sm bg-primary-100/50 p-4">
      <div class="flex items-center gap-4">
        <UTooltip text="Bekijk alle sessies">

          <UButton icon="mdi:home" variant="soft" color="secondary" to="/"></UButton>
        </UTooltip>
        <div>
          <div class="text-xs">{{ sessionsStore.currentSession?.title }} | {{ formattedDate }}</div>
          <h1 class="text-4xl font-bold">{{ currentSlide?.title }}</h1>
        </div>

      </div>

      <div class="flex items-center gap-2">
        <UBadge size="xl" icon="mdi-clock" color="secondary" variant="soft">
          <span class="font-mono font-bold">
            {{ currentSlide?.duration }} min
          </span> |
          <CurrentTime />
        </UBadge>



        <SlideEditor ref="slideEditor" />

        <UButton icon="mdi:printer" variant="outline" color="secondary">Print instructies</UButton>


      </div>


    </div>

    <Responses :responses="responsesStore.currentSessionResponses" />

    <div class="flex gap-2 justify-between items-center  z-10 backdrop-blur-sm bg-primary-100/50 p-4 pb-2">

      <Notes />
      <div
        class="flex gap-2 bg-primary-300 p-2 rounded-lg hover:scale-105 hover:rotate-1 transition-transform duration-600">
        <SendAudio />
        <ConnectInstructions />
      </div>
      <div class="flex gap-2">
        <UButton :icon="isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'" size="xl" variant="soft"
          color="secondary" @click="toggleFullscreen">
          {{ isFullscreen ? 'Sluit volledig scherm' : 'Volledig scherm' }}
        </UButton>
      </div>



    </div>

    <SlideSwitcher />


  </div>
</template>
