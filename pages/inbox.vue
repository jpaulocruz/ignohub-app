<script setup lang="ts">
import { marked } from 'marked'
import type { Database } from '../types/database.types'

const client = useSupabaseClient<Database>()
const selectedOrgId = useCookie('selected_organization_id')

const { validateOrg } = useOrgSecurity()
onMounted(() => {
  validateOrg()
})

// Types for inbox items
interface InboxItem {
  id: string
  type: 'summary' | 'alert' | 'insight'
  title: string
  description: string
  group_name: string
  group_platform: 'whatsapp' | 'telegram'
  created_at: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  is_read: boolean
}

// Selected item for detail panel
const selectedItem = ref<InboxItem | null>(null)

// Filter state
const activeFilter = ref<'all' | 'summary' | 'alert' | 'insight'>('all')
const searchQuery = ref('')

// Fetch inbox feed
const { data: inboxFeed, pending: feedPending } = useLazyAsyncData('inbox-feed', async () => {
  const orgId = selectedOrgId.value
  if (!orgId || orgId === 'undefined' || orgId === 'null') return []
  const { data } = await client
    .from('inbox_feed')
    .select('*')
    .eq('organization_id', selectedOrgId.value)
    .order('created_at', { ascending: false })
  return data || []
}, { watch: [selectedOrgId] })

// Demo items
const demoItems: InboxItem[] = [
  {
    id: 'demo-insight',
    type: 'insight',
    title: 'Boas-vindas ao IgnoHub: Sua Gestão de Comunidades com IA',
    description: 'Olá! Seja muito bem-vindo ao IgnoHub.\n\nEu sou sua Inteligência Artificial dedicada, projetada para transformar a forma como você administra seus grupos. Meu objetivo é trazer tranquilidade para você e relevância para seus membros.\n\n**O que eu faço por você 24/7:**\n\n🔹 **Resumos Inteligentes:** Chega de ler milhares de mensagens. Eu leio tudo e entrego apenas o que realmente importa, condensado e organizado.\n\n🔹 **Análise de Sentimento:** Eu monitoro o "clima" dos grupos. Se houver insatisfação ou conflitos, eu te aviso antes que vire uma crise.\n\n🔹 **Insights Estratégicos:** Identifico tendências e oportunidades de conteúdo para manter sua comunidade engajada e valiosa.\n\n🔹 **Tranquilidade na Moderação:** Detecto spam e comportamentos tóxicos automaticamente.\n\nCom o IgnoHub, você deixa de "apagar incêndios" e passa a liderar estrategicamente. Seus grupos deixam de ser apenas chats movimentados e se tornam ativos valiosos para o seu negócio.\n\nComece conectando seus grupos no menu "Comunidades" e deixe comigo o trabalho pesado!',
    group_name: 'IgnoHub Bot',
    group_platform: 'whatsapp',
    created_at: new Date().toISOString(),
    is_read: false
  },
  {
    id: 'demo-summary',
    type: 'summary',
    title: 'Resumo Diário - Comunidade Tech',
    description: 'Resumo das atividades de ontem:\n\n• Tópicos Principais: Discussão sobre Vue 3, dúvidas sobre Supabase e dicas de CSS.\n• Sentimento Geral: Positivo, com alta colaboração.\n• Membros Ativos: 45 mensagens de 12 usuários diferentes.\n\nNão houve incidentes reportados.',
    group_name: 'Comunidade Tech',
    group_platform: 'telegram',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    is_read: false
  },
  {
    id: 'demo-alert',
    type: 'alert',
    title: 'Alerta de Sentimento Negativo',
    description: 'Detectamos um pico de mensagens negativas no grupo "Suporte Geral".\n\nMotivo: Usuários reclamando de lentidão no acesso.\nRecomendação: Verificar status do servidor e enviar comunicado oficial.',
    group_name: 'Suporte Geral',
    group_platform: 'whatsapp',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    severity: 'high',
    is_read: false
  }
]

// Combined inbox items
const inboxItems = computed<InboxItem[]>(() => {
  const items = inboxFeed.value || []
  
  if (items.length === 0 && !pending.value) {
    return demoItems
  }
  
  return items as InboxItem[]
})

// Filtered items
const filteredItems = computed(() => {
  let items = inboxItems.value
  
  // Filter by type
  if (activeFilter.value !== 'all') {
    items = items.filter(i => i.type === activeFilter.value)
  }
  
  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(i => 
      i.title.toLowerCase().includes(query) || 
      i.description.toLowerCase().includes(query) ||
      i.group_name.toLowerCase().includes(query)
    )
  }
  
  return items
})

// Counts
const counts = computed(() => ({
  all: inboxItems.value.length,
  summary: inboxItems.value.filter(i => i.type === 'summary').length,
  alert: inboxItems.value.filter(i => i.type === 'alert').length,
  insight: inboxItems.value.filter(i => i.type === 'insight').length
}))

// Platform icon
const getPlatformIcon = (platform: string) => {
  return platform === 'telegram' ? 'i-simple-icons-telegram' : 'i-simple-icons-whatsapp'
}

// Type config
const typeConfig = {
  summary: { icon: 'i-heroicons-document-text', color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Resumo' },
  alert: { icon: 'i-heroicons-exclamation-triangle', color: 'text-red-500', bg: 'bg-red-500/10', label: 'Alerta' },
  insight: { icon: 'i-heroicons-light-bulb', color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Insight' }
}

// Severity config
const severityConfig: Record<string, { color: string, label: string }> = {
  low: { color: 'text-gray-500', label: 'Baixa' },
  medium: { color: 'text-yellow-500', label: 'Média' },
  high: { color: 'text-orange-500', label: 'Alta' },
  critical: { color: 'text-red-600', label: 'Crítica' }
}

// Format date
const formatDate = (date: string) => {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  } else if (days === 1) {
    return 'Ontem'
  } else if (days < 7) {
    return `${days} dias atrás`
  } else {
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }
}

// Select item
const selectItem = (item: InboxItem) => {
  selectedItem.value = item
}

// Computed property for parsed description
const parsedDescription = computed(() => {
  if (!selectedItem.value?.description) return ''
  return marked.parse(selectedItem.value.description)
})

const pending = computed(() => feedPending.value)
</script>

<template>
  <div class="flex h-[calc(100vh-64px)]">
    <!-- Left Panel: List -->
    <div class="w-full md:w-96 lg:w-[420px] border-r border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-950 shrink-0">
      <!-- Header -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-800">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">Inbox</h1>
          <UBadge color="primary" variant="soft">{{ counts.all }}</UBadge>
        </div>
        
        <!-- Search -->
        <UInput 
          v-model="searchQuery"
          placeholder="Buscar resumos, alertas..."
          icon="i-heroicons-magnifying-glass"
          size="sm"
          class="mb-3"
        />
        
        <!-- Filters -->
        <div class="flex gap-1">
          <UButton 
            :color="activeFilter === 'all' ? 'primary' : 'gray'"
            :variant="activeFilter === 'all' ? 'soft' : 'ghost'"
            size="xs"
            @click="activeFilter = 'all'"
          >
            Todos ({{ counts.all }})
          </UButton>
          <UButton 
            :color="activeFilter === 'summary' ? 'primary' : 'gray'"
            :variant="activeFilter === 'summary' ? 'soft' : 'ghost'"
            size="xs"
            @click="activeFilter = 'summary'"
          >
            <UIcon name="i-heroicons-document-text" class="w-3 h-3 mr-1" />
            Resumos
          </UButton>
          <UButton 
            :color="activeFilter === 'alert' ? 'primary' : 'gray'"
            :variant="activeFilter === 'alert' ? 'soft' : 'ghost'"
            size="xs"
            @click="activeFilter = 'alert'"
          >
            <UIcon name="i-heroicons-bell-alert" class="w-3 h-3 mr-1" />
            Alertas
          </UButton>
        </div>
      </div>
      
      <!-- Items List -->
      <div class="flex-1 overflow-y-auto">
        <!-- Loading -->
        <div v-if="pending" class="p-4 space-y-3">
          <USkeleton v-for="i in 5" :key="i" class="h-20 w-full rounded-lg" />
        </div>
        
        <!-- Empty State -->
        <div v-else-if="filteredItems.length === 0" class="flex flex-col items-center justify-center h-full p-8 text-center">
          <UIcon name="i-heroicons-inbox" class="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Inbox vazio</h3>
          <p class="text-gray-500 text-sm">Resumos e alertas das suas comunidades aparecerão aqui.</p>
        </div>
        
        <!-- Items -->
        <div v-else>
          <button
            v-for="item in filteredItems"
            :key="item.id"
            @click="selectItem(item)"
            class="w-full p-4 text-left border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
            :class="{ 'bg-electric-50 dark:bg-electric-500/5': selectedItem?.id === item.id }"
          >
            <div class="flex items-start gap-3">
              <!-- Type Icon -->
              <div :class="[typeConfig[item.type].bg, 'p-2 rounded-lg shrink-0']">
                <UIcon :name="typeConfig[item.type].icon" :class="[typeConfig[item.type].color, 'w-5 h-5']" />
              </div>
              
              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span :class="[typeConfig[item.type].color, 'text-xs font-medium uppercase']">
                    {{ typeConfig[item.type].label }}
                  </span>
                  <span v-if="item.severity" :class="[severityConfig[item.severity]?.color, 'text-xs']">
                    • {{ severityConfig[item.severity]?.label }}
                  </span>
                </div>
                
                <h3 class="font-medium text-gray-900 dark:text-white truncate text-sm">{{ item.title }}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{{ item.description }}</p>
                
                <!-- Group & Time -->
                <div class="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  <UIcon :name="getPlatformIcon(item.group_platform)" class="w-3.5 h-3.5" />
                  <span class="truncate">{{ item.group_name }}</span>
                  <span>•</span>
                  <span>{{ formatDate(item.created_at) }}</span>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Right Panel: Detail -->
    <div class="hidden md:flex flex-1 flex-col bg-gray-50 dark:bg-gray-900">
      <!-- No Selection -->
      <div v-if="!selectedItem" class="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <UIcon name="i-heroicons-inbox" class="w-10 h-10 text-gray-400" />
        </div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Selecione um item</h2>
        <p class="text-gray-500 max-w-sm">Clique em um resumo ou alerta à esquerda para ver os detalhes completos.</p>
      </div>
      
      <!-- Selected Item Detail -->
      <div v-else class="flex-1 overflow-y-auto">
        <div class="p-6 md:p-8 max-w-3xl mx-auto">
          <!-- Header -->
          <div class="flex items-start gap-4 mb-6">
            <div :class="[typeConfig[selectedItem.type].bg, 'p-3 rounded-xl shrink-0']">
              <UIcon :name="typeConfig[selectedItem.type].icon" :class="[typeConfig[selectedItem.type].color, 'w-8 h-8']" />
            </div>
            
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <UBadge :color="selectedItem.type === 'alert' ? 'red' : 'blue'" variant="soft" size="xs">
                  {{ typeConfig[selectedItem.type].label }}
                </UBadge>
                <UBadge v-if="selectedItem.severity" color="gray" variant="soft" size="xs">
                  {{ severityConfig[selectedItem.severity]?.label }}
                </UBadge>
              </div>
              
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ selectedItem.title }}</h1>
              
              <div class="flex items-center gap-3 mt-2 text-sm text-gray-500">
                <div class="flex items-center gap-1.5">
                  <UIcon :name="getPlatformIcon(selectedItem.group_platform)" class="w-4 h-4" />
                  <span>{{ selectedItem.group_name }}</span>
                </div>
                <span>•</span>
                <span>{{ new Date(selectedItem.created_at).toLocaleString('pt-BR') }}</span>
              </div>
            </div>
          </div>
          
          <!-- Content -->
          <UCard class="bg-white dark:bg-gray-800/50">
            <div class="prose dark:prose-invert max-w-none">
              <div v-html="parsedDescription" class="text-gray-700 dark:text-gray-300"></div>
            </div>
          </UCard>
          
          <!-- Actions -->
          <div class="flex gap-3 mt-6">
            <UButton 
              color="gray"
              variant="ghost"
              icon="i-heroicons-archive-box"
            >
              Arquivar
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
