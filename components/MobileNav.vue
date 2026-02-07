<script setup lang="ts">
const route = useRoute()

const navigation = [
  { label: 'Dashboard', icon: 'i-heroicons-home', to: '/', tooltip: 'Visão geral do sistema' },
  { label: 'Inbox', icon: 'i-heroicons-inbox', to: '/inbox', tooltip: 'Resumos e alertas' },
  { label: 'Comunidades', icon: 'i-heroicons-user-group', to: '/groups', tooltip: 'Grupos monitorados' },
  { label: 'Relatórios', icon: 'i-heroicons-chart-bar', to: '/reports', tooltip: 'Análises' },
  { label: 'Mais', icon: 'i-heroicons-ellipsis-horizontal', to: '/settings', tooltip: 'Configurações' }
]
</script>

<template>
  <nav class="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/80 dark:bg-gray-950/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 safe-area-bottom">
    <div class="flex items-center justify-around h-16 px-2">
      <NuxtLink
        v-for="item in navigation"
        :key="item.to"
        :to="item.to"
        :title="item.tooltip"
        :aria-label="item.tooltip"
        class="flex flex-col items-center justify-center gap-0.5 px-3 py-2 min-w-[64px] rounded-xl transition-colors"
        :class="[
          route.path === item.to 
            ? 'text-electric-500 bg-electric-500/10' 
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
        ]"
      >
        <UIcon 
          :name="item.icon" 
          class="w-6 h-6"
        />
        <span class="text-[10px] font-semibold">{{ item.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>

<style scoped>
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0);
}
</style>
