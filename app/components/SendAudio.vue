<script setup lang="ts">
const audioStore = useAudioStore()
const route = useRoute()

const { isRecording, isSending, volume, recordingSeconds, transcript } = storeToRefs(audioStore)
const { startRecording, cancelRecording, sendRecording } = audioStore

const handleSend = () => {
  const sessionID = route.params.sessionID as string
  sendRecording(sessionID)
}
</script>

<template>
  <UTooltip text="Neem samen een audiobericht op">
    <UButton icon="mdi:microphone" size="xl" @click="startRecording"
      class="cursor-pointer hover:scale-105 hover:-rotate-1 transition-transform duration-500">
      Groep huddle
    </UButton>
  </UTooltip>

  <UModal v-model:open="isRecording" fullscreen title="Opnemen van audiobericht"
    description="Neem je bericht op en verstuur het naar de AI." :ui="{ content: 'bg-secondary-100' }">
    <template #content>
      <div class="h-full flex flex-col justify-center items-center relative overflow-hidden">
        <div
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary-500/50 rounded-full pointer-events-none transition-all duration-50"
          :style="{ width: `${(volume / 128) * 100}vw`, height: `${(volume / 128) * 100}vw` }"></div>
        <div
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary-500/20 rounded-full pointer-events-none transition-all duration-75"
          :style="{ width: `${(volume / 128) * 200}vw`, height: `${(volume / 128) * 200}vw` }"></div>
        <div
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary-500/10 rounded-full pointer-events-none transition-all duration-100"
          :style="{ width: `${(volume / 128) * 300}vw`, height: `${(volume / 128) * 300}vw` }"></div>
        <UCard class="z-10 relative">
          <div class="space-y-6">
            <h1 class="text-4xl max-w-lg"><strong>Groep huddle:</strong> Neem samen een audiobericht op...</h1>
            <UBadge size="xl" icon="mdi-clock" color="neutral" variant="soft" class="font-mono">{{ recordingSeconds }}
              seconden</UBadge>
            <p class="text-xs text-gray-500 dark:text-gray-400 max-w-md">
              <span v-if="transcript">
                <strong>Live transcript (word straks automatisch verbeterd):</strong>
                {{ transcript }}
              </span>
              <span v-else>Begin met praten...</span>
            </p>
            <div class="items-center flex justify-center flex-wrap gap-6">
              <UButton @click="handleSend()" :loading="isSending" icon="mdi:send" size="xl" block>Verstuur audio
                bericht</UButton>
              <UButton icon="mdi:bin" color="error" variant="outline" @click="cancelRecording()">Verwijder
              </UButton>
            </div>

          </div>


        </UCard>

      </div>

    </template>

  </UModal>




</template>
