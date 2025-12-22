<script setup lang="ts">
const time = ref(new Date())
let interval: NodeJS.Timeout

onMounted(() => {
  interval = setInterval(() => {
    time.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  clearInterval(interval)
})

const formattedTime = computed(() => {
  return new Intl.DateTimeFormat('nl-NL', { timeStyle: 'short' }).format(time.value)
})
</script>

<template>
  <span class="font-mono">
    {{ formattedTime }}
  </span>
</template>
