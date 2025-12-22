<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import { colors } from '~/utils/colors'

definePageMeta({
  name: 'session'
})

const route = useRoute()
const sessionID = route.params.sessionID as string
const sessionsStore = useSessionsStore()
const responsesStore = useResponsesStore()

const formattedDate = computed(() => {
  if (!sessionsStore.currentSession?.scheduledAt) return ''
  const date = sessionsStore.currentSession.scheduledAt.toDate()
  return new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
})

const items = ref<TabsItem[]>([
  {
    label: 'Onze input',
    icon: 'mdi:folder',
    value: 'input'
  },
  {
    label: 'Output AI',
    icon: 'mdi:chat',
    value: 'output'
  }
])

const currentSlide = computed(() => {
  if (!sessionsStore.currentSession?.slides) return null
  return sessionsStore.currentSession.slides[sessionsStore.activeSlideIndex]
})

const hideResponses = ref(true)

watch(() => sessionsStore.activeSlideIndex, () => {
  hideResponses.value = true
})

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
  sessionsStore.activeSlideIndex = 0
  sessionsStore.subscribeToSession(sessionID)
  responsesStore.subscribeToResponses(sessionID)

  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

const slideEditor = ref()

const addSlide = async () => {
  if (!sessionsStore.currentSession?.id) return

  const randomColor = colors[Math.floor(Math.random() * colors.length)]

  const newSlide = {
    title: 'Nieuwe slide',
    duration: 0,
    agentInstructions: '',
    facilitatorNotes: '',
    color: randomColor
  }

  const slides = [...(sessionsStore.currentSession.slides || []), newSlide]

  await sessionsStore.updateSession(sessionsStore.currentSession.id, { slides })

  sessionsStore.activeSlideIndex = slides.length - 1

  await nextTick()
  slideEditor.value?.open()
}
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
        <UBadge size="xl" icon="mdi-clock" color="secondary" variant="soft">{{ currentSlide?.duration }} min</UBadge>



        <SlideEditor ref="slideEditor" />

        <UButton icon="mdi:printer" variant="outline" color="secondary">Print instructies</UButton>


      </div>


    </div>

    <Responses :responses="responsesStore.currentSessionResponses" :hide-responses="hideResponses"
      @show-responses="hideResponses = false" />

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

    <div class="flex gap-1 text-xs  z-10 backdrop-blur-sm bg-primary-100/50 p-4 pt-0">
      <UButton size="xs" v-for="(slide, index) in sessionsStore.currentSession?.slides" :key="index" block
        :variant="index === sessionsStore.activeSlideIndex ? 'solid' : 'soft'" color="primary"
        class="rounded-full cursor-pointer" @click="sessionsStore.activeSlideIndex = index">
        {{ slide.title }}
      </UButton>
      <UButton icon="mdi:plus" color="primary" size="xs" class="rounded-full" @click="addSlide"></UButton>
    </div>


  </div>
</template>
