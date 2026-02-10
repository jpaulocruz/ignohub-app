<script setup lang="ts">
import type { Database } from '../types/database.types'

const client = useSupabaseClient<Database>()

type AnalyticsItem = Database['public']['Tables']['group_analytics']['Row'] & {
  groups: { name: string } | null
}

type Insight = Database['public']['Tables']['member_insights']['Row'] & {
  groups: { name: string } | null
}

type Summary = Database['public']['Tables']['summaries']['Row'] & {
  groups: { name: string } | null
}

const selectedOrgId = useCookie('selected_organization_id')

const { validateOrg } = useOrgSecurity()
onMounted(() => {
  validateOrg()
})

const { data: analytics, pending: analyticsPending, refresh } = useLazyAsyncData<AnalyticsItem[]>('org-analytics', async () => {
  const orgId = selectedOrgId.value
  if (!orgId || orgId === 'undefined' || orgId === 'null') return []
  
  const { data, error } = await client
    .from('group_analytics')
    .select('*, groups(name)')
    .eq('organization_id', selectedOrgId.value)
    .order('period_start', { ascending: false })
    .limit(30)
    
  if (error) return []
  return (data || []) as AnalyticsItem[]
}, { watch: [selectedOrgId], server: false })

// Buscar insights de membros (Líderes e Detratores)
const { data: memberInsights, pending: membersPending } = useLazyAsyncData<Insight[]>('member-insights', async () => {
  const orgId = selectedOrgId.value
  if (!orgId || orgId === 'undefined' || orgId === 'null') return []
  const { data } = await client
    .from('member_insights')
    .select('*, groups(name)')
    .eq('organization_id', selectedOrgId.value)
    .order('created_at', { ascending: false })
  return (data || []) as Insight[]
}, { watch: [selectedOrgId], server: false })

const { data: latestSummary, pending: summaryPending } = useLazyAsyncData<Summary | null>('latest-exec-summary', async () => {
  const orgId = selectedOrgId.value
  if (!orgId || orgId === 'undefined' || orgId === 'null') return null
  const { data } = await client
    .from('summaries')
    .select('*, groups(name)')
    .eq('organization_id', selectedOrgId.value)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data as Summary | null
}, { watch: [selectedOrgId], server: false })

// Helpers para o Clima de Sentimento
const getClimate = (score: number) => {
  if (score >= 0.8) return { label: 'Excelente', icon: 'i-heroicons-sun', color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
  if (score >= 0.5) return { label: 'Positivo', icon: 'i-heroicons-cloud', color: 'text-blue-400', bg: 'bg-blue-500/10' }
  if (score >= 0.2) return { label: 'Neutro', icon: 'i-heroicons-cloud', color: 'text-gray-400', bg: 'bg-gray-500/10' }
  if (score >= -0.3) return { label: 'Tenso', icon: 'i-heroicons-cloud-lightning', color: 'text-orange-400', bg: 'bg-orange-500/10' }
  return { label: 'Crítico', icon: 'i-heroicons-bolt', color: 'text-red-400', bg: 'bg-red-500/10' }
}

// Agrupar analytics por grupo para os climogramas
const groupedAnalytics = computed(() => {
  if (!analytics.value) return {}
  return analytics.value.reduce((acc: any, item: AnalyticsItem) => {
    if (!acc[item.group_id]) acc[item.group_id] = { name: item.groups?.name, data: [] }
    acc[item.group_id].data.push(item)
    return acc
  }, {})
})

// Calcula variação percentual (Simulado se não houver dados históricos)
const getEvolution = (data: any[]) => {
  if (data.length < 2) return { val: '0%', up: true }
  const today = Number(data[0].sentiment_score)
  const yesterday = Number(data[1].sentiment_score)
  const diff = today - yesterday
  return { 
    val: (Math.abs(diff) * 100).toFixed(0) + '%',
    up: diff >= 0
  }
}
</script>

<template>
  <div class="space-y-8 p-6 lg:p-10 max-w-7xl mx-auto">
    <div class="space-y-1 border-b border-gray-800 pb-8">
      <h1 class="text-3xl font-bold text-white tracking-tight">Relatórios de Saúde</h1>
      <p class="text-gray-400 text-sm font-medium">Análise de sentimento e métricas de engajamento por comunidade.</p>
    </div>

    <!-- Resumo Executivo Diário -->
    <section v-if="summaryPending || latestSummary" class="space-y-4">
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-document-magnifying-glass" class="w-5 h-5 text-electric-400" />
        <h2 class="text-xl font-bold text-white tracking-tight">Resumo Executivo Diário</h2>
      </div>
      
      <USkeleton v-if="summaryPending" class="h-40 w-full bg-gray-900 border border-gray-800 rounded-3xl" />
      
      <div v-else-if="latestSummary" class="bg-gradient-to-br from-gray-900/60 to-gray-900/20 border border-gray-800 p-8 rounded-3xl relative overflow-hidden">
        <div class="absolute top-0 right-0 p-8 opacity-10">
          <UIcon name="i-heroicons-sparkles" class="w-24 h-24 text-electric-500" />
        </div>
        <div class="relative z-10 space-y-4 max-w-3xl">
          <div class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-electric-400">
            <span>{{ latestSummary.groups?.name }}</span>
            <span class="text-gray-700">|</span>
            <span>Última atualização: {{ useTimeAgo(latestSummary.created_at).value }}</span>
          </div>
          <p class="text-lg text-gray-200 leading-relaxed font-medium italic">
            "{{ latestSummary.summary_text }}"
          </p>
        </div>
      </div>
    </section>

    <!-- Group Metrics -->
    <div v-if="analyticsPending || Object.keys(groupedAnalytics).length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <template v-if="analyticsPending">
        <USkeleton v-for="i in 3" :key="i" class="h-64 w-full bg-gray-900/40 border border-gray-800 rounded-3xl" />
      </template>
      <UCard 
        v-else-if="Object.keys(groupedAnalytics).length"
        v-for="(group, id) in groupedAnalytics" 
        :key="id"
        class="bg-gray-900/40 border-gray-800"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-white text-sm tracking-tight">{{ group.name }}</h3>
            <UIcon name="i-heroicons-chart-bar" class="w-4 h-4 text-gray-500" />
          </div>
        </template>

        <div class="space-y-6">
          <!-- Climate Score -->
          <div class="flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em]">Clima Atual</span>
              <div class="flex items-center gap-2">
                <div :class="[getClimate(group.data[0].sentiment_score).bg, getClimate(group.data[0].sentiment_score).color]" class="p-1.5 rounded-lg">
                   <UIcon :name="getClimate(group.data[0].sentiment_score).icon" class="w-5 h-5" />
                </div>
                <span class="text-lg font-bold text-white">{{ getClimate(group.data[0].sentiment_score).label }}</span>
              </div>
            </div>
            
            <div class="text-right space-y-1">
              <span class="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em]">Evolução</span>
              <div class="flex items-center justify-end gap-1 font-bold" :class="getEvolution(group.data).up ? 'text-emerald-400' : 'text-red-400'">
                <UIcon :name="getEvolution(group.data).up ? 'i-heroicons-arrow-trending-up' : 'i-heroicons-arrow-trending-down'" class="w-4 h-4" />
                {{ getEvolution(group.data).val }}
              </div>
            </div>
          </div>

          <!-- Mini Trend Chart (SVG) -->
          <div class="h-16 w-full pt-4">
             <svg class="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="#3337f5"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  :points="group.data.slice().reverse().map((d: any, i: number) => `${(i / (group.data.length - 1)) * 100},${10 - (d.sentiment_score * 8)}`).join(' ')"
                />
             </svg>
          </div>

          <!-- Bottom Metrics -->
          <div class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
             <div>
                <p class="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Alertas (24h)</p>
                <p class="text-white font-bold">{{ group.data[0].alert_count_total || 0 }}</p>
             </div>
             <div>
                <p class="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Score IA</p>
                <p class="text-white font-bold">{{ (group.data[0].sentiment_score * 100).toFixed(0) }}</p>
             </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Empty State -->
    <div v-else class="py-24 text-center">
      <p class="text-gray-500">Sem dados analíticos suficientes para exibir relatórios no momento.</p>
    </div>

    <!-- Identificação de Membros -->
    <section v-if="membersPending || memberInsights?.length" class="space-y-6 pt-10">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-user-group" class="w-5 h-5 text-gray-500" />
          <h2 class="text-xl font-bold text-white tracking-tight">Identificação de Membros</h2>
        </div>
        <span class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">IA Powered Analysis</span>
      </div>

      <div v-if="membersPending" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <USkeleton class="h-4 w-32 bg-gray-800" />
          <USkeleton v-for="i in 2" :key="i" class="h-24 w-full bg-gray-900/20 rounded-2xl" />
        </div>
        <div class="space-y-4">
          <USkeleton class="h-4 w-32 bg-gray-800" />
          <USkeleton v-for="i in 2" :key="i" class="h-24 w-full bg-gray-900/20 rounded-2xl" />
        </div>
      </div>
      <div v-else-if="memberInsights?.length" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Líderes de Opinião -->
        <div class="space-y-4">
          <p class="text-xs font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Líderes de Opinião
          </p>
          <div class="space-y-3">
            <UCard 
              v-for="member in memberInsights.filter(m => m.role === 'Líder de Opinião')" 
              :key="member.id"
              class="bg-gray-900/20 border-gray-800/50 hover:bg-gray-900/40 transition-colors"
            >
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                   <UIcon name="i-heroicons-star" class="w-5 h-5 text-emerald-400" />
                </div>
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-white tracking-tight">{{ member.author_hash.substring(0, 8) }}...</span>
                    <span class="text-[10px] text-gray-500 font-bold uppercase">{{ member.groups?.name }}</span>
                  </div>
                  <p class="text-xs text-gray-400 leading-relaxed">{{ member.insight_text }}</p>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <!-- Detratores -->
        <div class="space-y-4">
          <p class="text-xs font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-red-500" />
            Detratores
          </p>
          <div class="space-y-3">
             <UCard 
              v-for="member in memberInsights.filter(m => m.role === 'Detrator')" 
              :key="member.id"
              class="bg-gray-900/20 border-gray-800/50 hover:bg-gray-900/40 transition-colors"
            >
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                   <UIcon name="i-heroicons-hand-thumb-down" class="w-5 h-5 text-red-400" />
                </div>
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-white tracking-tight">{{ member.author_hash.substring(0, 8) }}...</span>
                    <span class="text-[10px] text-gray-500 font-bold uppercase">{{ member.groups?.name }}</span>
                  </div>
                  <p class="text-xs text-gray-400 leading-relaxed">{{ member.insight_text }}</p>
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
svg {
  filter: drop-shadow(0 0 4px rgba(51, 55, 245, 0.3));
}
</style>
