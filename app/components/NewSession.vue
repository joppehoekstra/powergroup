<script setup lang="ts">
import { object, string, minLength, pipe, type InferOutput } from 'valibot'
import type { FormSubmitEvent } from '#ui/types'

const sessionsStore = useSessionsStore()
const isOpen = ref(false)
const form = ref()

function getDefaultDateTime() {
  const now = new Date()
  if (now.getMinutes() >= 30) {
    now.setHours(now.getHours() + 1)
  }
  now.setMinutes(0)
  now.setSeconds(0)
  now.setMilliseconds(0)

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`
  }
}

const schema = object({
  title: pipe(string(), minLength(1, 'Titel is verplicht')),
  date: pipe(string(), minLength(1, 'Datum is verplicht')),
  time: pipe(string(), minLength(1, 'Tijd is verplicht'))
})

type Schema = InferOutput<typeof schema>

const defaults = getDefaultDateTime()

const state = reactive<Schema>({
  title: '',
  date: defaults.date,
  time: defaults.time
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    const sessionId = await sessionsStore.createSession(event.data)
    isOpen.value = false
    // Reset form
    const newDefaults = getDefaultDateTime()
    state.title = ''
    state.date = newDefaults.date
    state.time = newDefaults.time

    if (sessionId) {
      await navigateTo(`/session/${sessionId}`)
    }
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
