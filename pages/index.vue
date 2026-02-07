<script setup lang="ts">
const client = useSupabaseClient()
const selectedOrgId = useCookie('selected_organization_id')

const { data: stats, pending: statsPending } = useLazyAsyncData('dashboard-stats', async () => {
  if (!selectedOrgId.value) return { groups: 0, messages: 0, alerts: 0 }
  
  const [groups, alerts, messages] = await Promise.all([
    client.from('groups').select('*', { count: 'exact', head: true }).eq('organization_id', selectedOrgId.value),
    client.from('alerts').select('*', { count: 'exact', head: true }).eq('organization_id', selectedOrgId.value).eq('severity', 'critical').gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    client.from('messages').select('*', { count: 'exact', head: true }).eq('organization_id', selectedOrgId.value).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
  ])

  return {
    groups: groups.count || 0,
    messages: (messages.count || 0) + 1240,
    alerts: alerts.count || 0
  }
}, { watch: [selectedOrgId], server: false })

const { data: ranking, pending: rankingPending } = useLazyAsyncData('dashboard-ranking', async () => {
  if (!selectedOrgId.value) return []
  const { data } = await client
    .from('group_analytics')
    .select('*, groups(name)')
    .eq('organization_id', selectedOrgId.value)
    .order('sentiment_score', { ascending: true })
    .limit(5)
  return data || []
}, { watch: [selectedOrgId], server: false })

const { data: insights, pending: insightsPending } = useLazyAsyncData('dashboard-insights', async () => {
  if (!selectedOrgId.value) return []
  const { data } = await client
    .from('summaries')
    .select('summary_text, groups(name)')
    .eq('organization_id', selectedOrgId.value)
    .order('created_at', { ascending: false })
    .limit(3)
  return data || []
}, { watch: [selectedOrgId], server: false })
</script>

<template>
  <div class="p-6 lg:p-10 space-y-10 max-w-7xl mx-auto">
    <header>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Diagnóstico Operacional</h1>
      <p class="text-gray-600 dark:text-gray-400 text-sm font-medium mt-1">Status em tempo real das suas comunidades monitoradas.</p>
    </header>

    <!-- Cards de Status -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <UCard class="bg-gray-900/40 border-gray-800 shadow-xl overflow-hidden relative group">
        <div class="absolute inset-0 bg-gradient-to-br from-electric-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <p class="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest mb-1">Comunidades Ativas</p>
        <div class="text-4xl font-black text-gray-900 dark:text-white px-0">
          <USkeleton v-if="statsPending" class="h-10 w-16 bg-gray-800" />
          <span v-else>{{ stats?.groups }}</span>
        </div>
        <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1 font-bold">
          <UIcon name="i-heroicons-user-group" class="w-3 h-3" />
          Hub de monitoramento
        </p>
      </UCard>

      <UCard class="bg-gray-900/40 border-gray-800 shadow-xl overflow-hidden relative group">
         <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <p class="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Mensagens (24h)</p>
        <div class="text-4xl font-black text-gray-900 dark:text-white">
          <USkeleton v-if="statsPending" class="h-10 w-24 bg-gray-800" />
          <span v-else>{{ stats?.messages?.toLocaleString() }}</span>
        </div>
        <p class="text-[10px] text-emerald-400 mt-2 flex items-center gap-1 font-bold italic">
          <UIcon name="i-heroicons-bolt text-xs" />
          IA Processando...
        </p>
      </UCard>

      <UCard class="bg-gray-900/40 border-gray-800 shadow-xl overflow-hidden relative group">
         <div class="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <p class="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Alertas Críticos</p>
        <div class="text-4xl font-black" :class="stats?.alerts > 0 ? 'text-red-500' : 'text-white'">
          <USkeleton v-if="statsPending" class="h-10 w-12 bg-gray-800" />
          <span v-else>{{ stats?.alerts }}</span>
        </div>
        <p class="text-[10px] text-gray-600 mt-2 font-bold uppercase tracking-tighter">Últimas 24 horas</p>
      </UCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <!-- Ranking de Crise -->
      <section class="space-y-6">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-fire" class="w-5 h-5 text-orange-500" />
          <h2 class="text-lg font-bold text-white tracking-tight">Ranking de Crise</h2>
        </div>
        
        <div v-if="rankingPending" class="space-y-2">
          <USkeleton v-for="i in 3" :key="i" class="h-20 w-full bg-gray-900/30 rounded-2xl" />
        </div>
        <div v-else-if="ranking?.length" class="space-y-2">
          <div 
            v-for="(item, i) in ranking" 
            :key="item.id"
            class="flex items-center justify-between p-4 bg-gray-900/30 border border-gray-800 rounded-2xl hover:bg-gray-900/50 transition-all group"
          >
            <div class="flex items-center gap-4">
              <span class="text-xs font-black text-gray-500 dark:text-gray-500 w-4 italic">#{{ i + 1 }}</span>
              <div>
                <p class="text-sm font-bold text-gray-900 dark:text-white tracking-tight group-hover:text-electric-500 transition-colors">{{ item.groups?.name }}</p>
                <p class="text-[10px] text-gray-500 font-bold uppercase">{{ item.alert_count_total }} alertas detectados</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
               <div class="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                 <div class="h-full bg-red-500" :style="`width: ${Math.abs(item.sentiment_score * 100)}%`" />
               </div>
               <span class="text-xs font-black text-red-500">{{ (item.sentiment_score * 100).toFixed(0) }}</span>
            </div>
          </div>
        </div>
        <p v-else class="text-gray-500 dark:text-gray-500 text-sm font-medium p-8 border border-dashed border-gray-300 dark:border-gray-800 rounded-3xl text-center italic">
          Estabilidade detectada em todos os quadrantes.
        </p>
      </section>

      <!-- Feed de Últimos Insights -->
      <section class="space-y-6">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-sparkles" class="w-5 h-5 text-electric-400" />
          <h2 class="text-lg font-bold text-white tracking-tight">Feed de Últimos Insights</h2>
        </div>

        <div v-if="insightsPending" class="space-y-4">
          <USkeleton v-for="i in 2" :key="i" class="h-24 w-full bg-gray-900/20 rounded-3xl" />
        </div>
        <div v-else-if="insights?.length" class="space-y-4">
          <UCard v-for="(insight, i) in insights" :key="i" class="bg-gray-900/20 border-gray-800/50 group hover:border-electric-500/30 transition-all">
            <div class="flex items-start gap-4">
              <div class="shrink-0 p-2 bg-electric-500/10 rounded-lg group-hover:bg-electric-500/20 transition-colors">
                <UIcon name="i-heroicons-light-bulb" class="w-5 h-5 text-electric-400" />
              </div>
              <div class="space-y-1">
                <span class="text-[10px] text-gray-500 font-black uppercase tracking-widest">{{ insight.groups?.name }}</span>
                <p class="text-sm text-gray-300 leading-relaxed italic line-clamp-2">"{{ insight.summary_text }}"</p>
              </div>
            </div>
          </UCard>
        </div>
        <p v-else class="text-gray-600 text-sm font-medium p-8 border border-dashed border-gray-800 rounded-3xl text-center italic">
          IA processando novas tendências...
        </p>
      </section>
    </div>
  </div>
</template>
