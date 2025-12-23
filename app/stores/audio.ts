export const useAudioStore = defineStore("audioStore", () => {
  const aiStore = useAIStore();
  const notesStore = useNotesStore();
  const firebaseStore = useFirebaseStore();

  const isRecording = ref(false);
  const isSending = ref(false);
  const mediaRecorder = ref<MediaRecorder | null>(null);
  const audioChunks = ref<Blob[]>([]);

  const audioContext = ref<AudioContext | null>(null);
  const analyser = ref<AnalyserNode | null>(null);
  const dataArray = ref<Uint8Array | null>(null);
  const volume = ref(0);
  let animationFrame: number | null = null;

  const recordingSeconds = ref(1);
  let recordingTimer: ReturnType<typeof setInterval> | null = null;

  const transcript = ref("");
  let recognition: any = null;

  function analyzeAudio() {
    if (!analyser.value || !dataArray.value) return;

    analyser.value.getByteFrequencyData(dataArray.value as any);
    const average =
      dataArray.value.reduce((a, b) => a + b, 0) / dataArray.value.length;
    volume.value = average;

    animationFrame = requestAnimationFrame(analyzeAudio);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      audioContext.value = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const source = audioContext.value.createMediaStreamSource(stream);
      analyser.value = audioContext.value.createAnalyser();
      analyser.value.fftSize = 256;
      source.connect(analyser.value);
      dataArray.value = new Uint8Array(analyser.value.frequencyBinCount);
      analyzeAudio();

      const options: MediaRecorderOptions = {
        audioBitsPerSecond: 16000,
      };

      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        options.mimeType = "audio/webm;codecs=opus";
      }

      mediaRecorder.value = new MediaRecorder(stream, options);
      audioChunks.value = [];
      transcript.value = "";

      mediaRecorder.value.ondataavailable = (event) => {
        audioChunks.value.push(event.data);
      };

      mediaRecorder.value.start();
      isRecording.value = true;

      startLiveTranscription();

      recordingSeconds.value = 1;
      recordingTimer = setInterval(() => {
        recordingSeconds.value++;
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  }

  function startLiveTranscription() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "nl-NL";

      recognition.onresult = (event: any) => {
        const results = Array.from(event.results);
        transcript.value = results
          .map((result: any) => result[0].transcript)
          .join("");
      };

      recognition.start();
    }
  }

  function stopLiveTranscription() {
    if (recognition) {
      recognition.stop();
      recognition = null;
    }
  }

  async function transcribeAudioFile(file: Blob) {
    transcript.value = "";
    try {
      const text = await aiStore.transcribeAudio(file);
      transcript.value = text;
      return text;
    } catch (error) {
      console.error("Transcription failed", error);
      throw error;
    }
  }

  function stopRecording() {
    if (recordingTimer) {
      clearInterval(recordingTimer);
      recordingTimer = null;
    }

    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    if (audioContext.value) {
      audioContext.value.close();
      audioContext.value = null;
    }
    volume.value = 0;

    if (mediaRecorder.value && mediaRecorder.value.state !== "inactive") {
      mediaRecorder.value.stop();

      // Stop all tracks to release microphone
      mediaRecorder.value.stream.getTracks().forEach((track) => track.stop());
    }

    stopLiveTranscription();
  }

  function cancelRecording() {
    if (mediaRecorder.value) {
      mediaRecorder.value.onstop = null;
    }
    stopRecording();
    isRecording.value = false;
  }

  async function sendRecording(sessionID: string) {
    if (!mediaRecorder.value) return;

    isSending.value = true;

    return new Promise<void>((resolve, reject) => {
      if (!mediaRecorder.value) {
        isSending.value = false;
        resolve();
        return;
      }

      mediaRecorder.value.onstop = async () => {
        try {
          const mimeType = mediaRecorder.value?.mimeType || "audio/webm";
          const audioBlob = new Blob(audioChunks.value, { type: mimeType });

          if (sessionID) {
            const fileId = crypto.randomUUID();
            const extension = mimeType.includes("webm") ? "webm" : "audio";
            const storagePath = `sessions/${sessionID}/${fileId}.${extension}`;

            const sessionFile = {
              id: fileId,
              sessionId: sessionID,
              type: "audio" as const,
              storagePath: storagePath,
              createdAt: new Date(),
              createdBy: firebaseStore.user?.uid || "",
            };

            await notesStore.uploadSessionFile(sessionFile, audioBlob);

            const note = {
              id: crypto.randomUUID(),
              sessionId: sessionID,
              fullText: transcript.value,
              fullTextModelUsed: "browser" as const,
              title: "",
              titleModelUsed: null,
              summary: "",
              summaryModelUsed: null,
              emoji: null,
              file: sessionFile,
              createdAt: null,
              createdBy: "",
              updatedAt: null,
              updatedBy: "",
            };
            await notesStore.addSessionNote(note);
          }

          isRecording.value = false;

          console.log("Transcript to send:", transcript.value);
          await aiStore.sendVoiceMessage(audioBlob, transcript.value);
          resolve();
        } catch (error) {
          console.error("Error sending voice message:", error);
          reject(error);
        } finally {
          isSending.value = false;
        }
      };

      stopRecording();
    });
  }

  watch(isRecording, (val) => {
    if (!val && !isSending.value) {
      cancelRecording();
    }
  });

  return {
    isRecording,
    isSending,
    volume,
    recordingSeconds,
    transcript,
    startRecording,
    stopRecording,
    cancelRecording,
    sendRecording,
    startLiveTranscription,
    stopLiveTranscription,
    transcribeAudioFile,
  };
});
