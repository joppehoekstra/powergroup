<script setup lang="ts">
const route = useRoute()
const sessionID = route.params.sessionID as string
const sessionsStore = useSessionsStore()

const isAddingSlide = ref(false)

const addSlide = async () => {
  if (!sessionsStore.currentSession?.id) return
  isAddingSlide.value = true

  try {
    const newSlideId = await sessionsStore.addSlide(sessionsStore.currentSession.id)
    if (newSlideId) {
      navigateTo(`/session/${sessionID}/${newSlideId}`)
    }
  } finally {
    isAddingSlide.value = false
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  const target = e.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    return
  }

  if (!sessionsStore.currentSession?.slides) return

  const slides = sessionsStore.currentSession.slides
  const currentIndex = slides.findIndex(s => s.id === route.params.slideID)

  if (currentIndex === -1) return

  if (e.key === 'ArrowLeft') {
    if (currentIndex > 0) {
      const prevSlide = slides[currentIndex - 1]
      if (prevSlide) {
        navigateTo({
          name: 'SessionSlide',
          params: { sessionID, slideID: prevSlide.id }
        })
      }
    }
  } else if (e.key === 'ArrowRight' || e.key === ' ') {
    if (currentIndex < slides.length - 1) {
      const nextSlide = slides[currentIndex + 1]
      if (nextSlide) {
        navigateTo({
          name: 'SessionSlide',
          params: { sessionID, slideID: nextSlide.id }
        })
      }
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
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
