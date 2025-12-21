import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  Schema,
} from "firebase/ai";
import { useFirebaseStore } from "./firebase";

const responseSchema = Schema.object({
  properties: {
    responses: Schema.array({
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

const prompt = `Je praat met een groep mensen die je net een audiobericht hebben gestuurd. Beantwoord dit audiobericht. Doe dit door je antwoord op te delen in precies 4 secties, die ieder de basis vormen voor een interessant gesprek voor de groep. Elke sectie moet een emoji, een titel en een beschrijving bevatten. De emoji moet de toon van de sectie weerspiegelen, de titel moet een goede gespreksstarter zijn, en de beschrijving moet meer gedetailleerde informatie geven. Gebruik de lengtes van de voorbeeldsecties als leidraad voor de lengte ervan.

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
  const { app } = firebaseStore;
  const toast = useToast();

  // Initialize the Gemini Developer API backend service
  const ai = getAI(app, { backend: new GoogleAIBackend() });

  // Create a `GenerativeModel` instance with a model that supports your use case
  const model = getGenerativeModel(ai, {
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  });

  async function fileToGenerativePart(file: Blob) {
    const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result.split(",")[1] || "");
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  }

  async function sendVoiceMessage(audio: Blob) {
    try {
      // Provide a prompt that contains text

      const audioPart = await fileToGenerativePart(audio);

      // To generate text output, call generateContent with the text and video
      const result = await model.generateContent([prompt, audioPart]);

      const response = result.response;
      const text = response.text();
      console.log("Generated text:", text);
      return text;
    } catch (error: any) {
      toast.add({
        title: "Error sending voice message",
        description: error.message,
        color: "error",
      });
      throw error;
    }
  }

  return { sendVoiceMessage };
});
