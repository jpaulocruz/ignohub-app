<script setup lang="ts">
const route = useRoute()
const user = useSupabaseUser()
const client = useSupabaseClient()
const colorMode = useColorMode()

const handleLogout = async () => {
  await client.auth.signOut()
  navigateTo('/login')
}

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const navigation = [
  { label: 'Dashboard', icon: 'i-heroicons-home', to: '/', tooltip: 'Visão geral do sistema' },
  { label: 'Inbox', icon: 'i-heroicons-inbox', to: '/inbox', tooltip: 'Resumos, alertas e insights' },
  { label: 'Comunidades', icon: 'i-heroicons-user-group', to: '/groups', tooltip: 'Gerenciar grupos monitorados' },
  { label: 'Relatórios', icon: 'i-heroicons-chart-bar', to: '/reports', tooltip: 'Análises e estatísticas' },
  { label: 'Configurações', icon: 'i-heroicons-cog-6-tooth', to: '/settings', tooltip: 'Preferências do sistema' }
]

const breadcrumbs = computed(() => {
  const paths = route.path.split('/').filter(Boolean)
  return [
    { label: 'Home', to: '/', icon: 'i-heroicons-home' },
    ...paths.map((path, index) => ({
      label: path.charAt(0).toUpperCase() + path.slice(1),
      to: '/' + paths.slice(0, index + 1).join('/')
    }))
  ]
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
    <!-- Sidebar (Desktop) -->
    <aside class="hidden md:flex flex-col w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex-shrink-0">
      <div class="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-800">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-gradient-to-br from-electric-400 to-electric-600 rounded-lg flex items-center justify-center shadow-lg shadow-electric-500/20">
            <UIcon name="i-heroicons-bolt" class="w-5 h-5 text-white" />
          </div>
          <span class="text-lg font-bold text-gray-900 dark:text-white tracking-tight">IgnoHub</span>
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto p-4 space-y-1">
        <NuxtLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          :title="item.tooltip"
          :aria-label="item.tooltip"
          class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors group"
          :class="[
            route.path === item.to 
              ? 'bg-electric-500/10 text-electric-600 dark:text-electric-400' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900/50'
          ]"
        >
          <UIcon 
            :name="item.icon" 
            class="w-5 h-5"
            :class="[route.path === item.to ? 'text-electric-500' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300']"
          />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="p-4 border-t border-gray-200 dark:border-gray-800">
        <div class="flex items-center gap-3 px-3 py-2 group cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900/50 rounded-xl transition-colors" @click="handleLogout">
          <UAvatar :src="user?.user_metadata?.avatar_url || 'https://github.com/github.png'" size="xs" />
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-gray-900 dark:text-white truncate">{{ user?.user_metadata?.full_name || user?.email }}</p>
            <p class="text-[10px] text-gray-500 truncate">Sair do sistema</p>
          </div>
          <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4 text-gray-400 group-hover:text-red-500" />
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Header -->
      <header class="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 md:px-6 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl sticky top-0 z-20">
        <div class="flex items-center gap-4">
          <!-- Mobile Logo -->
          <div class="md:hidden flex items-center gap-2">
            <div class="w-7 h-7 bg-gradient-to-br from-electric-400 to-electric-600 rounded-lg flex items-center justify-center shadow-md shadow-electric-500/20">
              <UIcon name="i-heroicons-bolt" class="w-4 h-4 text-white" />
            </div>
          </div>
          <TenantSwitcher />
          <div class="hidden md:block h-4 w-[1px] bg-gray-200 dark:bg-gray-800" />
          <UBreadcrumb :links="breadcrumbs" class="hidden md:block" />
        </div>

        <div class="flex items-center gap-1">
          <UButton 
            icon="i-heroicons-magnifying-glass" 
            color="gray" 
            variant="ghost" 
            class="hidden md:flex"
            title="Buscar no sistema"
            aria-label="Buscar"
          />
          <UButton 
            :icon="colorMode.value === 'dark' ? 'i-heroicons-sun' : 'i-heroicons-moon'" 
            color="gray" 
            variant="ghost"
            :title="colorMode.value === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'"
            :aria-label="colorMode.value === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'"
            @click="toggleTheme"
          />
        </div>
      </header>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto pb-20 md:pb-0 bg-gray-50 dark:bg-gray-950">
        <slot />
      </div>
    </main>

    <!-- Mobile Navigation -->
    <MobileNav />
  </div>
</template>

