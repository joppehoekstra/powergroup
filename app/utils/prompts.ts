export const SYSTEM_INSTRUCTIONS = `# FORMATTING INSTRUCTIES
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

export const TRANSCRIPTION_PROMPT =
  "Transcribe the following audio to Dutch text. Only return the transcription, nothing else.";

export const CONTENT_INSTRUCTIONS_HEADER = "# INHOUDELIJKE INSTRUCTIES";

export const GENERATE_SUMMARY_PROMPT = `Analyseer de volgende tekst en geef een titel (maximaal 5 woorden), een samenvatting (maximaal 3 zinnen) en een emoji die de tekst goed samenvat.`;

export const EXTRACT_TEXT_PROMPT =
  "Extract all text from this file verbatim. Do not summarize or interpret. Just return the text.";
