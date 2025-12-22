<script setup lang="ts">
const firebaseStore = useFirebaseStore();

onMounted(() => {
  firebaseStore.init();
});
</script>

<template>
  <UApp>

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
