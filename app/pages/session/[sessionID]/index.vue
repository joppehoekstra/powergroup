<script setup lang="ts">
const route = useRoute()
const sessionID = route.params.sessionID as string
const sessionsStore = useSessionsStore()

definePageMeta({
  name: 'Session',
})

let unsubscribe: (() => void) | undefined

onMounted(async () => {
  unsubscribe = await sessionsStore.subscribeToSession(sessionID)

  const unwatch = watch(() => sessionsStore.currentSession, (session) => {
    if (session && session.slides && session.slides.length > 0) {
      const firstSlide = session.slides[0]
      if (firstSlide && firstSlide.id) {
        navigateTo({
          name: 'SessionSlide',
          params: { sessionID, slideID: firstSlide.id }
        }, { replace: true })
        unwatch()
      }
    }
  }, { immediate: true })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})
</script>

<template>
  <div class="flex items-center justify-center h-screen">
    <UIcon name="i-mdi-loading" class="animate-spin text-4xl" />
  </div>
</template>
