<script setup lang="ts">
import { object, string, minLength, pipe, type InferOutput } from 'valibot'
import type { FormSubmitEvent } from '#ui/types'

const sessionsStore = useSessionsStore()
const isOpen = ref(false)
const form = ref()

const schema = object({
  title: pipe(string(), minLength(1, 'Titel is verplicht')),
  date: pipe(string(), minLength(1, 'Datum is verplicht')),
  time: pipe(string(), minLength(1, 'Tijd is verplicht'))
})

type Schema = InferOutput<typeof schema>

const state = reactive<Schema>({
  title: '',
  date: '',
  time: ''
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    await sessionsStore.createSession(event.data)
    isOpen.value = false
    // Reset form
    state.title = ''
    state.date = ''
    state.time = ''
  } catch (error) {
    console.error(error)
  }
}
</script>

<template>
  <UModal v-model:open="isOpen">
    <UButton icon="mdi:plus" size="xl">Nieuwe sessie</UButton>

    <template #header>
      <div class="flex items-center justify-between w-full">
        <h2 class="font-bold">Nieuwe sessie</h2>
        <UButton trailing-icon="mdi:arrow-right" @click="form?.submit()">Maak aan</UButton>
      </div>
    </template>

    <template #body>
      <UForm ref="form" :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Titel" name="title">
          <UInput v-model="state.title" class="w-full" placeholder="Brainstorm strategie..." />
        </UFormField>
        <UFormField label="Datum" name="date">
          <UInput v-model="state.date" type="date" class="w-full" icon="mdi:calendar" />
        </UFormField>
        <UFormField label="Tijd" name="time">
          <UInput v-model="state.time" type="time" class="w-full" icon="mdi:clock" />
        </UFormField>
      </UForm>
    </template>
  </UModal>
</template>
