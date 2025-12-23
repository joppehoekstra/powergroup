import {
  GenerativeModel,
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  Schema,
  type AI,
} from "firebase/ai";
import { useFirebaseStore } from "./firebase";
import { useSessionsStore } from "./sessions";
import { useNotesStore, type SessionNote } from "./notes";
import { useResponsesStore, type Response } from "./responses";
import {
  CONTENT_INSTRUCTIONS_HEADER,
  DEFAULT_CONTENT_INSTRUCTIONS,
  EXTRACT_TEXT_PROMPT,
  GENERATE_SUMMARY_PROMPT,
  SYSTEM_INSTRUCTIONS,
  TRANSCRIPTION_PROMPT,
} from "~/utils/prompts";

const responseSchema = Schema.object({
  properties: {
    sections: Schema.array({
      items: Schema.object({
        properties: {
          emoji: Schema.string(),
          title: Schema.string(),
          description: Schema.string(),
        },
      }),
    }),
  },
});

const summarySchema = Schema.object({
  properties: {
    title: Schema.string(),
    summary: Schema.string(),
    emoji: Schema.string(),
  },
});

export const useAIStore = defineStore("aiStore", () => {
  const firebaseStore = useFirebaseStore();
  const sessionsStore = useSessionsStore();
  const responsesStore = useResponsesStore();
  const notesStore = useNotesStore();
  const toast = useToast();

  const ai = shallowRef<AI>();
  const responseModel = shallowRef<GenerativeModel>();
  const transcriptionModel = shallowRef<GenerativeModel>();
  const summarizationModel = shallowRef<GenerativeModel>();

  function init() {
    try {
      // Initialize the Gemini Developer API backend service
      ai.value = getAI(firebaseStore.app, { backend: new GoogleAIBackend() });

      // Create a `GenerativeModel` instance with a model that supports your use case
      responseModel.value = getGenerativeModel(ai.value, {
        model: "gemini-3-flash-preview",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          // @ts-ignore
          thinkingConfig: {
            includeThoughts: true,
          },
        },
      });

      transcriptionModel.value = getGenerativeModel(ai.value, {
        model: "gemini-2.5-flash-lite",
        generationConfig: {
          responseMimeType: "text/plain",
        },
      });

      summarizationModel.value = getGenerativeModel(ai.value, {
        model: "gemini-2.5-flash-lite",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: summarySchema,
        },
      });
    } catch (error: any) {
      console.error("Error initializing AI:", error);
      toast.add({
        title: "Error initializing AI",
        description: error.message,
        color: "error",
      });
    }
  }

  async function fileToGenerativePart(file: Blob) {
    try {
      const base64EncodedDataPromise = new Promise<string>(
        (resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === "string") {
              resolve(reader.result.split(",")[1] || "");
            } else {
              reject(new Error("Failed to read file"));
            }
          };
          reader.readAsDataURL(file);
        }
      );
      return {
        inlineData: {
          data: await base64EncodedDataPromise,
          mimeType: file.type,
        },
      };
    } catch (error: any) {
      console.error("Error converting file to generative part:", error);
      toast.add({
        title: "Error processing file",
        description: error.message,
        color: "error",
      });
      throw error;
    }
  }

  async function transcribeAudio(audio: Blob): Promise<string> {
    try {
      if (!transcriptionModel.value) {
        throw new Error("AI model not initialized");
      }

      const parts = [];
      parts.push(TRANSCRIPTION_PROMPT);
      const audioPart = await fileToGenerativePart(audio);
      parts.push(audioPart);

      const result = await transcriptionModel.value.generateContent(parts);
      return result.response.text();
    } catch (error: any) {
      console.error("Error transcribing audio:", error);
      toast.add({
        title: "Error transcribing audio",
        description: error.message,
        color: "error",
      });
      throw error;
    }
  }

  async function sendVoiceMessage(audio: Blob, transcriptText?: string) {
    try {
      // Set an empty temporary response immediately to show loading state
      responsesStore.setTemporaryResponse({});

      const route = useRoute();
      const sessionID = route.params.sessionID as string;
      const slideID = route.params.slideID as string;

      // --- Build Chat History ---
      const history: { role: "user" | "model"; parts: any[] }[] = [];

      // 1. Get Notes (User messages)
      const notes = notesStore.notes.filter((n) => n.sessionId === sessionID);
      const sortedNotes = [...notes].sort((a, b) => {
        const tA = a.createdAt?.toMillis() || 0;
        const tB = b.createdAt?.toMillis() || 0;
        return tA - tB;
      });
      // Exclude the very last note (current message)
      const historicalNotes = sortedNotes.slice(0, -1);

      // 2. Get Responses (Model messages)
      const responses = responsesStore.currentSessionResponses.filter(
        (r) => r.sessionId === sessionID && r.id
      );
      const sortedResponses = [...responses].sort((a, b) => {
        const tA = a.createdAt?.toMillis() || 0;
        const tB = b.createdAt?.toMillis() || 0;
        return tA - tB;
      });

      // 3. Merge and Sort Events
      const allEvents = [
        ...historicalNotes.map((n) => ({
          type: "user" as const,
          data: n,
          time: n.createdAt?.toMillis() || 0,
        })),
        ...sortedResponses.map((r) => ({
          type: "model" as const,
          data: r,
          time: r.createdAt?.toMillis() || 0,
        })),
      ].sort((a, b) => a.time - b.time);

      // 4. Construct Gemini History
      for (const event of allEvents) {
        if (event.type === "user") {
          const note = event.data as SessionNote;
          let part = null;

          if (note.fullText) {
            part = { text: note.fullText };
          } else if (note.file) {
            try {
              let blob: Blob | null = null;
              let url: string | null | undefined = note.file.url;
              if (!url && note.file.storagePath) {
                const fetchedUrl = await notesStore.getFile(
                  note.file.storagePath
                );
                if (fetchedUrl) url = fetchedUrl;
              }
              if (url) {
                const resp = await fetch(url);
                blob = await resp.blob();
                if (blob) {
                  part = await fileToGenerativePart(blob);
                }
              }
            } catch (e) {
              console.error("Error fetching file for history:", e);
            }
          }

          if (part) {
            const last = history[history.length - 1];
            if (last && last.role === "user") {
              last.parts.push(part);
            } else {
              history.push({ role: "user", parts: [part] });
            }
          }
        } else {
          const response = event.data as Response;
          const json = JSON.stringify({ sections: response.responseSections });
          const part = { text: json };

          const last = history[history.length - 1];
          if (last && last.role === "model") {
            last.parts.push(part);
          } else {
            history.push({ role: "model", parts: [part] });
          }
        }
      }

      // STEP 1: Prepare input to send to the model
      const currentSlide = sessionsStore.currentSession?.slides.find(
        (s) => s.id === slideID
      );

      let parts = [];

      if (currentSlide?.agentInstructions) {
        const slideInstructions = `${CONTENT_INSTRUCTIONS_HEADER}\n${currentSlide?.agentInstructions}`;
        parts.push(slideInstructions);
      } else {
        const slideInstructions = `${CONTENT_INSTRUCTIONS_HEADER}\n${DEFAULT_CONTENT_INSTRUCTIONS}`;
        parts.push(slideInstructions);
      }

      parts.push(SYSTEM_INSTRUCTIONS);

      const audioPart = await fileToGenerativePart(audio);
      parts.push(audioPart);

      // STEP 2: Call the model to generate a response
      const chat = responseModel.value!.startChat({
        history: history,
      });
      const result = await chat.sendMessageStream(parts);

      // STEP 3: Process the response stream
      function parseJSON(text: string) {
        try {
          // Clean up the response text if it contains markdown code blocks
          const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
          const responseData = JSON.parse(cleanText);

          return responseData;
        } catch (e) {
          return null;
        }
      }

      let text = "";
      let thoughtSummary = "";

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        text += chunkText;

        const thought = chunk.thoughtSummary();
        if (thought) {
          thoughtSummary += thought;
        }

        const responseData = parseJSON(text);
        if (responseData) {
          responsesStore.setTemporaryResponse({
            responseSections: responseData.sections,
            temporaryThinkingResponse: thoughtSummary,
          });
        } else if (thoughtSummary) {
          responsesStore.setTemporaryResponse({
            temporaryThinkingResponse: thoughtSummary,
          });
        }
      }

      // STEP 4: Save the final response
      const finalText = (await result.response).text();
      const finalThought = (await result.response).thoughtSummary();

      if (finalText || finalThought) {
        const finalParsedData = parseJSON(finalText);

        if (finalParsedData) {
          await responsesStore.createResponse({
            sessionID: route.params.sessionID as string,
            slideID: route.params.slideID as string,
            responseSections: finalParsedData.sections,
            thoughtSummary: finalThought,
          });
        } else {
          console.error("Failed to parse AI response as JSON:", text);
        }
      } else {
        console.error("No response text received from AI model");
      }
    } catch (error: any) {
      console.error("Error sending voice message:", error);
      toast.add({
        title: "Error sending voice message",
        description: error.message,
        color: "error",
      });
      throw error;
    }
  }

  async function extractText(file: Blob): Promise<string> {
    try {
      if (!transcriptionModel.value) {
        throw new Error("AI model not initialized");
      }

      const parts = [];
      parts.push(EXTRACT_TEXT_PROMPT);

      const filePart = await fileToGenerativePart(file);
      parts.push(filePart);

      const result = await transcriptionModel.value.generateContent(parts);
      return result.response.text();
    } catch (error: any) {
      console.error("Error extracting text:", error);
      toast.add({
        title: "Error extracting text",
        description: error.message,
        color: "error",
      });
      throw error;
    }
  }

  async function generateEmojiTitleSummary(text: string): Promise<{
    title: string;
    summary: string;
    emoji: string;
    model: "browser" | "llm";
  }> {
    try {
      if (!summarizationModel.value) {
        throw new Error("AI model not initialized");
      }

      let parts = [];

      parts.push(GENERATE_SUMMARY_PROMPT);
      parts.push(text);

      const result = await summarizationModel.value.generateContent(parts);
      const responseText = result.response.text();
      const json = JSON.parse(responseText);

      return {
        title: json.title,
        summary: json.summary,
        emoji: json.emoji,
        model: "llm",
      };
    } catch (error: any) {
      console.error("Error generating title and summary:", error);
      toast.add({
        title: "Error generating summary",
        description: error.message,
        color: "error",
      });
      throw error;
    }
  }

  return {
    sendVoiceMessage,
    init,
    transcribeAudio,
    extractText,
    generateEmojiTitleSummary,
  };
});
