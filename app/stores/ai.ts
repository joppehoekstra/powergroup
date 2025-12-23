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

const systemInstructions = `# FORMATTING INSTRUCTIES
Je praat met een groep mensen die je net een audiobericht hebben gestuurd. Beantwoord dit audiobericht. Doe dit door je antwoord op te delen in precies 4 secties. Elke sectie moet een emoji, een titel en een beschrijving bevatten. De emoji moet de toon van de sectie weerspiegelen, de titel moet een goede gespreksstarter zijn, en de beschrijving moet meer gedetailleerde informatie geven. Gebruik de lengtes van de voorbeeldsecties als leidraad voor de lengte ervan.

Gebruik de 'INHOUDELIJKE INSTRUCTIES' sectie om te bepalen hoe je het audiobericht beantwoordt. Alle secties samen vormen altijd de basis voor een interessant gesprek voor de groep. Een sectie kan een kritisch perspectief zijn, een vraag aan de groep, of een opdracht/instructies.

Je antwoord moet een JSON object zijn met 4 secties, zoals dit:
{
  "sections": [
    {
      "emoji": "👍",
      "title": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt?",
      "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    },
    {
      "emoji": "👎",
      "title": "Lorem ipsum dolor sit amet, consectetur adipiscing elit!",
      "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    },
    {
      "emoji": "🤔",
      "title": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt?",
      "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    },
    {
      "emoji": "🎉",
      "title": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    }
  ]
}`;

export const useAIStore = defineStore("aiStore", () => {
  const firebaseStore = useFirebaseStore();
  const sessionsStore = useSessionsStore();
  const responsesStore = useResponsesStore();
  const toast = useToast();

  const ai = ref<AI>();
  const model = ref<GenerativeModel>();

  function init() {
    try {
      // Initialize the Gemini Developer API backend service
      ai.value = getAI(firebaseStore.app, { backend: new GoogleAIBackend() });

      // Create a `GenerativeModel` instance with a model that supports your use case
      model.value = getGenerativeModel(ai.value, {
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

  async function sendVoiceMessage(audio: Blob, transcriptText?: string) {
    try {
      // Set an empty temporary response immediately to show loading state
      responsesStore.setTemporaryResponse({});

      // STEP 1: Prepare input to send to the model

      const route = useRoute();
      const slideID = route.params.slideID as string;
      // Provide a prompt that contains text
      const currentSlide = sessionsStore.currentSession?.slides.find(
        (s) => s.id === slideID
      );

      let parts = [];

      if (currentSlide?.agentInstructions) {
        const slideInstructions = `# INHOUDELIJKE INSTRUCTIES\n${currentSlide?.agentInstructions}`;
        parts.push(slideInstructions);
      }

      parts.push(systemInstructions);

      const audioPart = await fileToGenerativePart(audio);
      parts.push(audioPart);

      // STEP 2: Call the model to generate a response
      const result = await model.value!.generateContentStream(parts);

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

  return { sendVoiceMessage, init };
});
