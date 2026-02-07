<script setup lang="ts">
const user = useSupabaseUser()

watch(user, () => {
  if (user.value) {
    return navigateTo('/')
  }
}, { immediate: true })
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-950">
    <div class="text-center">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-electric-500 animate-spin mb-4" />
      <p class="text-gray-400">Confirmando seu acesso...</p>
    </div>
  </div>
</template>
