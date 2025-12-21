<script setup lang="ts">
const stepTitle = ref('')
const isOpen = ref(false)
</script>
<template>
  <UModal fullscreen v-model:open="isOpen">
    <UButton icon="mdi:edit" color="neutral" variant="outline">Bewerk slide</UButton>

    <template #header>
      <div class="flex items-center justify-between w-full">
        <h2 class="font-bold">Bewerk stap</h2>
        <UButton icon="mdi:check" @click="isOpen = false">Bewaar</UButton>
      </div>

    </template>
    <template #body>
      <div>
        <UFormField label="Titel">
          <UInput v-model="stepTitle" class="mb-4 w-full" placeholder="Brainstorm strategie..." />
        </UFormField>
        <UFormField label="Tijd">
          <UInput v-model="stepTitle" class="mb-4 w-full" placeholder="10 minuten..." icon="mdi-clock" />
        </UFormField>
        <UFormField label="Instructies voor AI" description="Gebruik markdown voor formatting (# Titel, *bold*)">

          <UTextarea class="w-full" autoresize placeholder="Je bent een ervaren campagnestrateeg die..." :rows="12" />
        </UFormField>
      </div>

    </template>
  </UModal>

</template>
