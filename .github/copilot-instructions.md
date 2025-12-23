# GitHub Copilot Instructions for PowerBrainstorm

## Project Overview

PowerBrainstorm is a Nuxt 4 application designed for facilitating group brainstorming sessions using AI. It leverages Firebase for backend services (Firestore, Auth, App Check) and Google Gemini (via `firebase/ai`) for AI capabilities.

## Tech Stack

- **Framework:** Nuxt 4 (Vue 3)
- **Language:** TypeScript
- **State Management:** Pinia
- **UI Library:** Nuxt UI (Tailwind CSS)
- **Backend:** Firebase (Firestore, Auth, App Check)
- **AI:** Google Gemini (`firebase/ai`)
- **Package Manager:** pnpm

## Architecture & Core Concepts

### Directory Structure

- **`app/`**: Contains the main application source code (Nuxt 4 structure).
  - **`stores/`**: Centralized state and business logic. **Prefer placing logic here over components.**
  - **`pages/`**: File-based routing.
  - **`components/`**: Vue components.
  - **`utils/`**: Helper functions (e.g., colors).

### State Management (Pinia)

- **`firebase.ts`**: Handles Firebase initialization, Anonymous Auth, and App Check.
  - **Pattern:** Always use `useFirebaseStore()` to access `db`, `auth`, or `app` instances.
  - **Initialization:** `firebaseStore.init()` is called in `app.vue` `onMounted`.
- **`ai.ts`**: Manages interactions with the Gemini API.
  - **Pattern:** Uses `getGenerativeModel` with a specific JSON schema for structured responses.
  - **Streaming:** Handles streaming responses and parses JSON chunks progressively.
- **`sessions.ts`**: Manages session data, slides, and facilitator instructions.

### AI Integration

- **Model:** `gemini-3-flash-preview` (configured in `ai.ts`).
- **Input:** Multimodal (Text instructions + Audio blobs).
- **Output:** Structured JSON (4 sections with emoji, title, description).
- **Helper:** `fileToGenerativePart` converts Blobs to base64 for the API.

## Coding Conventions

### TypeScript & Vue

- Use `<script setup lang="ts">` for components.
- Explicitly type all props and store state.
- Use `defineStore` for Pinia stores.

### Firebase

- **Do not import Firebase SDKs directly in components.** Use the `firebaseStore` to access initialized instances.
- **Auth:** The app uses anonymous authentication by default (`signInAnonymously`).

### Nuxt 4

- Use `useRuntimeConfig()` for accessing environment variables (public/private keys).
- Follow Nuxt 4 auto-import conventions (no need to import `ref`, `computed`, `useRoute`, etc.).

## Critical Workflows

### Running the App

```bash
pnpm dev
```

### Adding New Features

1.  **Data:** Define interfaces in the relevant store (e.g., `stores/sessions.ts`).
2.  **Logic:** Implement actions in the store.
3.  **UI:** Create/Update components in `app/components/` and connect to the store.

### AI Prompting

- System instructions are defined in `stores/ai.ts`.
- Slide-specific instructions are injected dynamically from `sessionsStore`.
