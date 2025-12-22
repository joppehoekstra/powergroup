<script setup lang="ts">
import { onAuthStateChanged } from 'firebase/auth';
const sessionsStore = useSessionsStore();

let unsubscribeSessions: (() => void) | undefined;

const firebaseStore = useFirebaseStore();


onMounted(() => {


  onAuthStateChanged(firebaseStore.auth!, (user) => {
    if (user) {
      unsubscribeSessions = sessionsStore.subscribeToUserSessions(user.uid);
    } else {
      if (unsubscribeSessions) unsubscribeSessions();
      // Optional: clear sessions on logout
      // sessionsStore.userSessions = [];
    }
  });
});

onUnmounted(() => {
  if (unsubscribeSessions) unsubscribeSessions();
});

const formatDate = (timestamp: any) => {
  if (!timestamp || !timestamp.toDate) return '';
  return timestamp.toDate().toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' });
};
</script>
<template>
  <UContainer class="py-8 space-y-4">
    <NewSession />
    <UPageList class="space-y-4">
      <UCard v-for="session in sessionsStore.userSessions" :key="session.id">
        <UUser :name="session.title" :description="formatDate(session.scheduledAt)" size="xl"
          :to="{ name: 'SessionSlide', params: { sessionID: session.id, slideID: session.slides?.[0]?.id } }" />
      </UCard>
    </UPageList>
  </UContainer>

</template>
