<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'

definePageMeta({
  name: 'session'
})

const route = useRoute()
const sessionID = route.params.sessionID as string
const sessionsStore = useSessionsStore()
const responsesStore = useResponsesStore()

const formattedDate = computed(() => {
  if (!sessionsStore.currentSession?.scheduledAt) return ''
  const date = sessionsStore.currentSession.scheduledAt.toDate ? sessionsStore.currentSession.scheduledAt.toDate() : new Date(sessionsStore.currentSession.scheduledAt)
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


const steps = ref([
  {
    id: 1,
    title: 'Context ophalen',
  },
  {
    id: 2,
    title: 'Context verwerken',
  },
  {
    id: 3,
    title: 'Evaluatie',
  },
  {
    id: 4,
    title: 'Coachend gesprek',
  },
  {
    id: 5,
    title: 'Volgende stappen',
  },
])

const activeStepID = ref(1)

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
  responsesStore.subscribeToResponses(sessionID)

  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})
</script>

<template>



  <div class="flex flex-col h-full w-full fixed top-0 gap-4 p-4">

    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <UButton icon="mdi:arrow-left" variant="soft" color="neutral" to="/"></UButton>
        <div>
          <div class="text-xs text-neutral-400">{{ sessionsStore.currentSession?.title }} | {{ formattedDate }}</div>
          <h1 class="text-4xl">Context ophalen</h1>
        </div>

      </div>

      <div class="flex items-center gap-2">
        <UBadge size="xl" icon="mdi-clock" color="neutral" variant="soft">10 minuten</UBadge>



        <StepEditor />

      </div>


    </div>



    <Responses :responses="responsesStore.currentSessionResponses" />

    <div class="flex gap-2 justify-between items-center">


      <Notes />
      <div class="flex gap-2 ">
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

    <div class="flex gap-1 text-xs">
      <UButton size="xs" v-for="(step, index) in steps" block :variant="step.id === activeStepID ? 'solid' : 'soft'"
        color="neutral" class="rounded-full cursor-pointer" @click="activeStepID = step.id">
        {{ step.title }}
      </UButton>
      <UButton icon="mdi:plus" color="neutral" size="xs" class="rounded-full"></UButton>
    </div>


  </div>
</template>
