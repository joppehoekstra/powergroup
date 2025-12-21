<script setup lang="ts">
const aiStore = useAIStore()
const responsesStore = useResponsesStore()
const route = useRoute()

const emit = defineEmits(['response'])

const isRecording = ref(false)
const isSending = ref(false)
const mediaRecorder = ref<MediaRecorder | null>(null)
const audioChunks = ref<Blob[]>([])

const audioContext = ref<AudioContext | null>(null)
const analyser = ref<AnalyserNode | null>(null)
const dataArray = ref<Uint8Array | null>(null)
const volume = ref(0)
let animationFrame: number | null = null

const recordingSeconds = ref(1)
let recordingTimer: ReturnType<typeof setInterval> | null = null

const transcript = ref('')
let recognition: any = null

const analyzeAudio = () => {
  if (!analyser.value || !dataArray.value) return

  analyser.value.getByteFrequencyData(dataArray.value as any)
  const average = dataArray.value.reduce((a, b) => a + b, 0) / dataArray.value.length
  volume.value = average

  animationFrame = requestAnimationFrame(analyzeAudio)
}

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)()
    const source = audioContext.value.createMediaStreamSource(stream)
    analyser.value = audioContext.value.createAnalyser()
    analyser.value.fftSize = 256
    source.connect(analyser.value)
    dataArray.value = new Uint8Array(analyser.value.frequencyBinCount)
    analyzeAudio()

    mediaRecorder.value = new MediaRecorder(stream)
    audioChunks.value = []
    transcript.value = ''

    mediaRecorder.value.ondataavailable = (event) => {
      audioChunks.value.push(event.data)
    }

    mediaRecorder.value.start()
    isRecording.value = true

    // Start Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'nl-NL'

      recognition.onresult = (event: any) => {
        const results = Array.from(event.results)
        transcript.value = results
          .map((result: any) => result[0].transcript)
          .join('')
      }

      recognition.start()
    }

    recordingSeconds.value = 1
    recordingTimer = setInterval(() => {
      recordingSeconds.value++
    }, 1000)
  } catch (error) {
    console.error('Error accessing microphone:', error)
  }
}

const stopRecording = (closeModal = true) => {
  if (recordingTimer) {
    clearInterval(recordingTimer)
    recordingTimer = null
  }

  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
  if (audioContext.value) {
    audioContext.value.close()
    audioContext.value = null
  }
  volume.value = 0

  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    mediaRecorder.value.stop()

    // Stop all tracks to release microphone
    mediaRecorder.value.stream.getTracks().forEach(track => track.stop())
  }

  if (recognition) {
    recognition.stop()
    recognition = null
  }

  if (closeModal) isRecording.value = false
}

const sendRecording = () => {
  if (!mediaRecorder.value) return

  isSending.value = true

  mediaRecorder.value.onstop = async () => {
    try {
      const mimeType = mediaRecorder.value?.mimeType || 'audio/webm'
      const audioBlob = new Blob(audioChunks.value, { type: mimeType })
      const responseText = await aiStore.sendVoiceMessage(audioBlob)
      if (responseText) {
        try {
          // Clean up the response text if it contains markdown code blocks
          const cleanText = responseText.replace(/```json\n?|\n?```/g, '').trim()
          const responseData = JSON.parse(cleanText)

          await responsesStore.createResponse(route.params.sessionID as string, responseData)

          emit('response', responseData)
        } catch (e) {
          console.error("Failed to parse response", e)
        }
      }
    } catch (error) {
      console.error('Error sending voice message:', error)
    } finally {
      isSending.value = false
      isRecording.value = false
    }
  }

  stopRecording(false)
}

const cancelRecording = () => {
  if (mediaRecorder.value) {
    mediaRecorder.value.onstop = null
  }
  stopRecording()
}

watch(isRecording, (val) => {
  if (!val) {
    cancelRecording()
  }
})
</script>

<template>
  <UTooltip text="Neem samen een audiobericht op">
    <UButton icon="mdi:microphone" size="xl" @click="startRecording"
      class="cursor-pointer hover:scale-105 hover:-rotate-1 transition-transform duration-500">
      Groep huddle
    </UButton>
  </UTooltip>

  <UModal v-model:open="isRecording" fullscreen title="Opnemen van audiobericht"
    description="Neem je bericht op en verstuur het naar de AI.">
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
            <p class="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
              <span v-if="transcript">
                <strong>Live transcript (word straks automatisch verbeterd):</strong>
                {{ transcript }}
              </span>
              <span v-else>Begin met praten...</span>
            </p>
            <div class="items-center flex justify-center flex-wrap gap-6">
              <UButton @click="sendRecording()" :loading="isSending" icon="mdi:send" size="xl" block>Verstuur audio
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
