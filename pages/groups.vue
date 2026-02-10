<script setup lang="ts">
import CommunityWizard from '~/components/groups/CommunityWizard.vue'
import type { Database } from '../types/database.types'

const client = useSupabaseClient<Database>()
const selectedOrgId = useCookie('selected_organization_id')
const showWizard = ref(false)

const { data: groups, pending: groupsPending, refresh } = useLazyAsyncData('org-groups', async () => {
  if (!selectedOrgId.value) return []
  
  const { data, error } = await client
    .from('groups')
    .select('*, agent_presets(*)')
    .eq('organization_id', selectedOrgId.value)
    .order('created_at', { ascending: false })
    
  if (error) return []
  return data
}, { watch: [selectedOrgId], server: false })

// Agrupar por plataforma
const groupedGroups = computed(() => {
  if (!groups.value) return {}
  return groups.value.reduce((acc: any, group: any) => {
    const platform = group.platform || 'Outros'
    if (!acc[platform]) acc[platform] = []
    acc[platform].push(group)
    return acc
  }, {})
})

const handleSuccess = () => {
  showWizard.value = false
  refresh()
}

const platforms = [
  { id: 'WhatsApp', icon: 'i-simple-icons-whatsapp', color: 'emerald' },
  { id: 'Telegram', icon: 'i-simple-icons-telegram', color: 'blue' },
  { id: 'Discord', icon: 'i-simple-icons-discord', color: 'indigo' }
]

const getPlatformIcon = (platform: string) => {
  return platforms.find(p => p.id.toLowerCase() === platform.toLowerCase())?.icon || 'i-heroicons-globe-alt'
}
const getPlatformColor = (platform: string) => {
  return platforms.find(p => p.id.toLowerCase() === platform.toLowerCase())?.color || 'gray'
}
</script>

<template>
  <div class="space-y-10 p-6 lg:p-10 max-w-7xl mx-auto">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-800 pb-10">
      <div class="space-y-1">
        <h1 class="text-3xl font-black text-white tracking-tight">O Hub de Comunidades</h1>
        <p class="text-gray-400 text-sm font-medium">Gerencie seus agentes simbióticos e conexões externas.</p>
      </div>
      <div class="flex items-center gap-3">
        <UButton
          label="Central de Convites"
          variant="outline"
          color="gray"
          icon="i-heroicons-paper-airplane"
          class="font-bold border-gray-800"
          @click="showWizard = true"
        />
        <UButton
          icon="i-heroicons-plus"
          label="Adicionar Grupo"
          color="primary"
          size="lg"
          class="font-bold shadow-lg shadow-electric-500/20"
          @click="showWizard = true"
        />
      </div>
    </div>

    <!-- Loading / Empty State -->
    <div v-if="groupsPending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <USkeleton v-for="i in 3" :key="i" class="h-64 w-full bg-gray-900/40 rounded-3xl" />
    </div>
    
    <div v-else-if="!groups?.length" class="py-24 flex flex-col items-center justify-center text-center bg-gray-900/10 border-2 border-dashed border-gray-800/50 rounded-3xl">
      <div class="w-20 h-20 bg-gray-800/50 rounded-3xl flex items-center justify-center mb-6 border border-gray-800">
        <UIcon name="i-heroicons-user-group" class="w-10 h-10 text-gray-700" />
      </div>
      <h3 class="text-xl font-bold text-white mb-2">Seu Hub está vazio</h3>
      <p class="text-gray-400 max-w-sm mx-auto mb-8 font-medium">Adicione seu primeiro Agente Sentinel ou Hunter para começar a extrair inteligência.</p>
      <UButton
        label="Conectar Comunidade"
        variant="solid"
        color="primary"
        class="font-bold"
        @click="showWizard = true"
      />
    </div>

    <!-- Platform Sections -->
    <div v-else class="space-y-12">
      <div v-for="platform in platforms" :key="platform.id" class="space-y-6">
        <div v-if="groupedGroups[platform.id]" class="flex items-center gap-3">
           <div :class="`bg-${platform.color}-500/10 p-2 rounded-xl`">
             <UIcon :name="platform.icon" :class="`text-${platform.color}-500`" class="w-5 h-5" />
           </div>
           <h2 class="text-lg font-bold text-white tracking-tight uppercase tracking-widest text-xs opacity-60">{{ platform.id }}</h2>
           <div class="h-[1px] bg-gray-800 flex-1" />
           <span class="text-[10px] text-gray-600 font-black">{{ groupedGroups[platform.id].length }} GRUPOS</span>
        </div>

        <div v-if="groupedGroups[platform.id]" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UCard
            v-for="group in groupedGroups[platform.id]"
            :key="group.id"
            class="bg-gray-900/40 border-gray-800 hover:border-gray-700 transition-all group overflow-hidden"
          >
            <div class="flex items-start justify-between mb-6">
              <div class="flex items-center gap-3">
                <div class="p-2.5 bg-gray-950 rounded-2xl border border-gray-800">
                  <UIcon :name="getPlatformIcon(group.platform)" :class="`text-${getPlatformColor(group.platform)}-400`" class="w-6 h-6" />
                </div>
                <div>
                  <h3 class="font-bold text-white text-sm tracking-tight group-hover:text-electric-400 transition-colors">{{ group.name }}</h3>
                  <div class="flex items-center gap-1.5 text-emerald-400">
                    <span class="w-1 h-1 rounded-full bg-emerald-400" />
                    <span class="text-[9px] font-black uppercase tracking-widest">Agente Ativo</span>
                  </div>
                </div>
              </div>
              <UBadge 
                :color="group.is_active ? 'emerald' : 'orange'" 
                variant="soft" 
                size="xs"
                class="font-black uppercase tracking-tighter"
              >
                {{ group.is_active ? 'Ativo' : 'Pendente' }}
              </UBadge>
            </div>

            <div class="space-y-4">
              <div class="flex items-center justify-between text-[11px] font-bold">
                <span class="text-gray-500 uppercase tracking-widest">Especialista</span>
                <div class="flex items-center gap-1.5 text-electric-400">
                  <UIcon :name="group.agent_presets?.icon || 'i-heroicons-sparkles'" class="w-3.5 h-3.5" />
                  <span>{{ group.agent_presets?.name || 'Não definido' }}</span>
                </div>
              </div>
              
              <div class="p-4 bg-gray-950/40 border border-gray-800/50 rounded-2xl space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Clima Coletivo</span>
                  <span class="text-xs text-white font-black italic">—</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Alertas Pendentes</span>
                  <span class="text-xs text-white font-black italic">—</span>
                </div>
              </div>
            </div>

            <template #header-side>
              <div class="flex items-center gap-2">
                <UButton icon="i-heroicons-cog-6-tooth" color="gray" variant="ghost" size="xs" />
              </div>
            </template>

            <template #footer>
              <div class="flex items-center gap-2">
                <UButton block label="Visualizar Feed" color="gray" variant="ghost" size="xs" class="font-bold border border-gray-800" :to="`/summaries`" />
                <UButton icon="i-heroicons-chart-bar" color="gray" variant="ghost" size="xs" class="border border-gray-800" :to="`/reports`" />
              </div>
            </template>
          </UCard>
        </div>
      </div>
    </div>

    <!-- Wizard Modal -->
    <CommunityWizard 
      v-if="showWizard" 
      @close="showWizard = false" 
      @success="handleSuccess" 
    />
  </div>
</template>
