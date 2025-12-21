<script setup lang="ts">

</script>


<template>

  <UModal fullscreen title="Verbind meer apparaten">
    <UButton icon="mdi:qrcode" size="xl"
      class="cursor-pointer hover:scale-105 hover:-rotate-1 transition-transform duration-500">Verbind meer apparaten
    </UButton>

    <template #body>
      <div class="flex items-center justify-center p-4 text-center flex-1">
        <div class="text-2xl">
          Scan de QR-code met een ander apparaat om verbinding te maken met deze sessie.
        </div>

      </div>
      <div class="text-center space-y-8">
        <UIcon name="mdi:qrcode-scan" class=" mt-4 text-9xl " />
        <div class="max-w-2xl m-auto">
          Tip: gebruik <strong>Begeleide
            Toegang / Guided Access</strong> op iOS of <strong>App Vastzetten / Screen Pinning</strong> op Android om
          ervoor te zorgen
          dat mensen niet op
          Insta gaan scrollen
          tijdens het
          groepsgesprek.
        </div>
      </div>



    </template>
  </UModal>


</template>
