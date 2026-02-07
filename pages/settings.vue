<script setup lang="ts">
const user = useSupabaseUser()
const client = useSupabaseClient()
const selectedOrgId = useCookie('selected_organization_id')
const colorMode = useColorMode()
const toast = useToast()
const loading = ref(false)
const checkoutLoading = ref<string | null>(null)
const portalLoading = ref(false)

// Stripe Price IDs (from Stripe dashboard)
const STRIPE_PRICES = {
  pro: {
    priceId: 'price_1SwCVPDPO8OWHdcl1AIkjVrv',
    productId: 'prod_Tu0S5qR6xQB1M8',
    planId: 'fb7c884a-da33-4338-ba60-bcc7023513ab'
  },
  business: {
    priceId: 'price_1SwCRgDPO8OWHdclRZ0v7tUz', 
    productId: 'prod_Tu0SP7eQE6nT6q',
    planId: '3b5210c1-f8eb-4dfb-9c35-73ad6005776f'
  },
  enterprise: {
    priceId: 'price_1SwCSKDPO8OWHdcljhveUBiC',
    productId: 'prod_Tu0TexPVyXQQ0O', 
    planId: '2480be8e-2dfd-4b20-ac56-f6f7edcef024'
  }
}

// Get Stripe price ID for a plan
const getStripePriceId = (planId: string) => {
  const entry = Object.values(STRIPE_PRICES).find(p => p.planId === planId)
  return entry?.priceId
}

// Profile data - watch user to refresh when authenticated
// Profile data - watch user to refresh when authenticated
const { data: profile, pending: profilePending, refresh: refreshProfile, error: profileError } = useLazyAsyncData(
  () => `user-profile-${user.value?.id}`,
  async () => {
    console.log('[Settings] Fetching profile for user:', user.value?.id)
    if (!user.value?.id) return null
    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .single()
      
      if (error) {
        console.error('[Settings] Profile fetch error:', error)
        throw error
      }
      console.log('[Settings] Profile data received:', data)
      return data
    } catch (e) {
      console.error('[Settings] Profile exception:', e)
      return null
    }
  }, { watch: [user] }
)

// Organization data with stripe_customer_id
// Organization data with stripe_customer_id
const { data: organization, pending: orgPending, refresh: refreshOrg } = useLazyAsyncData(
  () => `current-org-settings-${selectedOrgId.value}`,
  async () => {
    console.log('[Settings] Fetching organization for ID:', selectedOrgId.value)
    if (!selectedOrgId.value) return null
    const { data, error } = await client
      .from('organizations')
      .select('*, plans(*)')
      .eq('id', selectedOrgId.value)
      .single()
    
    if (error) console.error('[Settings] Org fetch error:', error)
    return data
  }, { watch: [selectedOrgId] }
)

// All available plans
const { data: allPlans, pending: plansPending } = useLazyAsyncData('all-plans', async () => {
  const { data } = await client
    .from('plans')
    .select('*')
    .order('price_monthly', { ascending: true })
  return data
})

// Stripe invoices (placeholder - requires stripe_customer_id on organization)
const invoices = ref<any[]>([])
const invoicesPending = ref(false)

// Notification settings
const notificationEmail = ref('')
const notificationPhone = ref('')
const emailAlerts = ref(true)
const whatsappAlerts = ref(false)
const dailySummaries = ref(true)

// Fetch ALL notification endpoints (email and whatsapp)
// Fetch ALL notification endpoints (email and whatsapp)
const { data: notificationEndpoints, refresh: refreshEndpoints } = useLazyAsyncData(
  () => `notification-endpoints-${selectedOrgId.value}`, 
  async () => {
    console.log('[Settings] Fetching endpoints for org:', selectedOrgId.value)
    if (!selectedOrgId.value) return []
    const { data, error } = await client
      .from('notification_endpoints')
      .select('*')
      .eq('organization_id', selectedOrgId.value)
    
    if (error) console.error('[Settings] Endpoints fetch error:', error)
    return data || []
  }, { watch: [selectedOrgId] }
)

// Computed endpoints by type
const emailEndpoint = computed(() => notificationEndpoints.value?.find((e: any) => e.type === 'email'))
const whatsappEndpoint = computed(() => notificationEndpoints.value?.find((e: any) => e.type === 'whatsapp'))

// Initialize notification values when data loads
watch(notificationEndpoints, (endpoints) => {
  if (endpoints?.length) {
    const email = endpoints.find((e: any) => e.type === 'email')
    const whatsapp = endpoints.find((e: any) => e.type === 'whatsapp')
    
    if (email) {
      notificationEmail.value = email.target || ''
      emailAlerts.value = email.is_active ?? true
    }
    if (whatsapp) {
      notificationPhone.value = whatsapp.target || ''
      whatsappAlerts.value = whatsapp.is_active ?? false
    }
  }
}, { immediate: true })

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const updateProfile = async () => {
  if (!profile.value?.full_name) {
    toast.add({ title: 'Por favor, insira seu nome completo', color: 'orange' })
    return
  }
  
  loading.value = true
  const { error } = await client
    .from('profiles')
    .update({ full_name: profile.value.full_name })
    .eq('id', user.value?.id)
  
  loading.value = false
  if (error) {
    toast.add({ title: 'Erro ao atualizar perfil', color: 'red' })
  } else {
    toast.add({ title: 'Perfil atualizado com sucesso!', color: 'emerald' })
  }
}

// Unified save for all notification settings
const saveNotificationSettings = async () => {
  if (!selectedOrgId.value) {
    toast.add({ title: 'Nenhuma organização selecionada', color: 'orange' })
    return
  }
  
  loading.value = true
  
  try {
    // Save/Update Email endpoint
    if (notificationEmail.value) {
      if (emailEndpoint.value) {
        await client
          .from('notification_endpoints')
          .update({ 
            target: notificationEmail.value,
            is_active: emailAlerts.value
          })
          .eq('id', emailEndpoint.value.id)
      } else {
        await client
          .from('notification_endpoints')
          .insert({
            organization_id: selectedOrgId.value,
            type: 'email',
            target: notificationEmail.value,
            is_active: emailAlerts.value
          })
      }
    }
    
    // Save/Update WhatsApp endpoint
    if (notificationPhone.value) {
      if (whatsappEndpoint.value) {
        await client
          .from('notification_endpoints')
          .update({ 
            target: notificationPhone.value,
            is_active: whatsappAlerts.value
          })
          .eq('id', whatsappEndpoint.value.id)
      } else {
        await client
          .from('notification_endpoints')
          .insert({
            organization_id: selectedOrgId.value,
            type: 'whatsapp',
            target: notificationPhone.value,
            is_active: whatsappAlerts.value
          })
      }
    }
    
    toast.add({ title: 'Configurações salvas com sucesso!', color: 'emerald', icon: 'i-heroicons-check-circle' })
    await refreshEndpoints()
  } catch (error: any) {
    toast.add({ title: 'Erro ao salvar configurações', description: error.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

const updateOrg = async () => {
  loading.value = true
  const { error } = await client
    .from('organizations')
    .update({ name: organization.value.name })
    .eq('id', selectedOrgId.value)
  
  loading.value = false
  if (error) {
    toast.add({ title: 'Erro ao atualizar organização', color: 'red' })
  } else {
    toast.add({ title: 'Organização atualizada!', color: 'emerald' })
  }
}

const settingsSections = [
  { id: 'profile', label: 'Perfil', icon: 'i-heroicons-user-circle', tooltip: 'Gerencie suas informações pessoais' },
  { id: 'appearance', label: 'Aparência', icon: 'i-heroicons-paint-brush', tooltip: 'Personalize tema e cores do sistema' },
  { id: 'notifications', label: 'Notificações', icon: 'i-heroicons-bell', tooltip: 'Configure alertas e resumos por email' },
  { id: 'subscription', label: 'Assinatura', icon: 'i-heroicons-credit-card', tooltip: 'Visualize planos e faturas' },
  { id: 'organization', label: 'Organização', icon: 'i-heroicons-building-office', tooltip: 'Gerencie sua organização e membros' }
]

const activeSection = ref('profile')

const isCurrentPlan = (plan: any) => {
  return organization.value?.plans?.id === plan?.id
}

// Stripe checkout for upgrade
const startCheckout = async (plan: any) => {
  const priceId = getStripePriceId(plan.id)
  if (!priceId) {
    toast.add({ title: 'Plano ainda não configurado para pagamento online. Entre em contato.', color: 'orange' })
    return
  }
  
  checkoutLoading.value = plan.id
  
  try {
    const { url } = await $fetch<{ url: string }>('/api/stripe/create-checkout', {
      method: 'POST',
      body: {
        priceId,
        successUrl: `${window.location.origin}/settings?tab=subscription&success=true`,
        cancelUrl: `${window.location.origin}/settings?tab=subscription`
      }
    })
    
    if (url) {
      window.location.href = url
    }
  } catch (error: any) {
    toast.add({ title: error.message || 'Erro ao iniciar checkout', color: 'red' })
  } finally {
    checkoutLoading.value = null
  }
}

// Open Stripe billing portal
const openBillingPortal = async () => {
  toast.add({ title: 'Portal de cobrança em breve!', description: 'Acesso ao histórico de faturas será disponibilizado em breve.', color: 'blue' })
}

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// Format date
const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString('pt-BR')
}

// Check URL params for success message
onMounted(() => {
  const route = useRoute()
  if (route.query.success === 'true') {
    toast.add({ title: 'Assinatura realizada com sucesso!', color: 'emerald', icon: 'i-heroicons-check-circle' })
  }
  if (route.query.tab === 'subscription') {
    activeSection.value = 'subscription'
  }
})
</script>

<template>
  <div class="flex flex-col md:flex-row min-h-full">
    <!-- Settings Navigation -->
    <aside class="md:w-64 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 md:p-6">
      <h1 class="text-xl font-bold text-gray-900 dark:text-white mb-6 hidden md:block">Configurações</h1>
      
      <nav class="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
        <button
          v-for="section in settingsSections"
          :key="section.id"
          :title="section.tooltip"
          @click="activeSection = section.id"
          class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors"
          :class="[
            activeSection === section.id 
              ? 'bg-electric-500/10 text-electric-600 dark:text-electric-400' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900'
          ]"
        >
          <UIcon :name="section.icon" class="w-5 h-5 shrink-0" />
          <span>{{ section.label }}</span>
        </button>
      </nav>
    </aside>

    <!-- Settings Content -->
    <main class="flex-1 p-6 md:p-10 max-w-3xl">
      <!-- Profile Section -->
      <section v-if="activeSection === 'profile'" class="space-y-8">
        <header>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Seu Perfil</h2>
          <p class="text-gray-600 dark:text-gray-400 text-sm mt-1">Gerencie suas informações pessoais e dados da conta.</p>
        </header>

        <div v-if="profilePending" class="space-y-4">
          <USkeleton class="h-24 w-full rounded-2xl" />
          <USkeleton class="h-12 w-full" />
          <USkeleton class="h-12 w-full" />
          <USkeleton class="h-10 w-32" />
        </div>

        <div v-else-if="profile" class="space-y-6">
          <!-- Avatar & Quick Info -->
          <UCard class="bg-white dark:bg-gray-900/40">
            <div class="flex items-center gap-5">
              <div class="relative">
                <UAvatar 
                  :alt="profile.full_name || user?.email || 'User'" 
                  size="xl"
                  class="ring-4 ring-electric-500/20"
                  :ui="{ size: { xl: 'w-20 h-20 text-2xl' }}"
                />
                <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-white dark:border-gray-900 flex items-center justify-center">
                  <UIcon name="i-heroicons-check" class="w-3 h-3 text-white" />
                </div>
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ profile.full_name || 'Seu Nome' }}</h3>
                <p class="text-gray-500 dark:text-gray-400">{{ user?.email }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <UBadge color="primary" variant="soft" size="xs">Ativo</UBadge>
                  <span class="text-xs text-gray-400">Membro desde {{ new Date(user?.created_at || Date.now()).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) }}</span>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Edit Profile Form -->
          <UCard class="bg-white dark:bg-gray-900/40">
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-pencil-square" class="w-5 h-5 text-gray-500" />
                <span class="font-semibold text-gray-900 dark:text-white">Editar Perfil</span>
              </div>
            </template>
            <div class="space-y-6">
              <UFormGroup label="Nome Completo" hint="Como você quer ser chamado">
                <UInput 
                  v-model="profile.full_name" 
                  placeholder="Seu nome completo" 
                  size="lg"
                  icon="i-heroicons-user"
                />
              </UFormGroup>
              
              <UFormGroup label="Email" hint="Vinculado à sua conta (não pode ser alterado)">
                <UInput 
                  :model-value="user?.email" 
                  disabled 
                  size="lg" 
                  class="opacity-60"
                  icon="i-heroicons-envelope"
                />
              </UFormGroup>

              <UButton 
                label="Salvar Alterações" 
                color="primary" 
                size="lg"
                :loading="loading"
                icon="i-heroicons-check"
                @click="updateProfile"
              />
            </div>
          </UCard>

          <!-- Organization Info -->
          <UCard v-if="organization" class="bg-white dark:bg-gray-900/40">
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-building-office-2" class="w-5 h-5 text-gray-500" />
                <span class="font-semibold text-gray-900 dark:text-white">Sua Organização</span>
              </div>
            </template>
            <div class="flex items-center justify-between">
              <div>
                <p class="font-bold text-gray-900 dark:text-white">{{ organization.name }}</p>
                <p class="text-sm text-gray-500">Plano: <span class="text-electric-500 font-medium">{{ organization.plans?.name || 'Free' }}</span></p>
              </div>
              <UButton 
                label="Ver Plano" 
                color="gray" 
                variant="soft"
                size="sm"
                @click="activeSection = 'subscription'"
              />
            </div>
          </UCard>
        </div>

        <!-- No profile data -->
        <div v-else class="text-center py-8">
          <UIcon name="i-heroicons-user-circle" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p class="text-gray-600 dark:text-gray-400">Carregando dados do perfil...</p>
        </div>
      </section>

      <!-- Appearance Section -->
      <section v-if="activeSection === 'appearance'" class="space-y-8">
        <header>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Aparência</h2>
          <p class="text-gray-600 dark:text-gray-400 text-sm mt-1">Personalize a aparência visual do sistema.</p>
        </header>

        <div class="space-y-6">
          <UCard class="bg-white dark:bg-gray-900/40">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="p-3 rounded-xl bg-gray-100 dark:bg-gray-800">
                  <UIcon :name="colorMode.value === 'dark' ? 'i-heroicons-moon' : 'i-heroicons-sun'" class="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-white">Tema do Sistema</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">{{ colorMode.value === 'dark' ? 'Modo Escuro ativo' : 'Modo Claro ativo' }}</p>
                </div>
              </div>
              <UToggle 
                :model-value="colorMode.value === 'dark'" 
                @update:model-value="toggleTheme"
                on-icon="i-heroicons-moon"
                off-icon="i-heroicons-sun"
              />
            </div>
          </UCard>
        </div>
      </section>

      <!-- Notifications Section -->
      <section v-if="activeSection === 'notifications'" class="space-y-6">
        <header>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Notificações</h2>
          <p class="text-gray-600 dark:text-gray-400 text-sm mt-1">Configure como e quando receber alertas e resumos das suas comunidades.</p>
        </header>

        <div class="space-y-4">
          <!-- Email Card -->
          <UCard class="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
            <div class="flex items-start gap-4">
              <div class="p-3 rounded-xl bg-electric-500/10 shrink-0">
                <UIcon name="i-heroicons-envelope" class="w-6 h-6 text-electric-500" />
              </div>
              <div class="flex-1 space-y-4">
                <div>
                  <p class="font-semibold text-gray-900 dark:text-white">Email</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Receba resumos e alertas importantes por email</p>
                </div>
                
                <UInput 
                  v-model="notificationEmail"
                  type="email"
                  placeholder="seu@email.com"
                  size="md"
                  icon="i-heroicons-at-symbol"
                />
                
                <div class="flex flex-wrap gap-4">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <UToggle v-model="emailAlerts" size="sm" />
                    <span class="text-sm text-gray-700 dark:text-gray-300">Alertas Críticos</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <UToggle v-model="dailySummaries" size="sm" />
                    <span class="text-sm text-gray-700 dark:text-gray-300">Resumos Diários</span>
                  </label>
                </div>
              </div>
            </div>
          </UCard>

          <!-- WhatsApp Card -->
          <UCard class="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
            <div class="flex items-start gap-4">
              <div class="p-3 rounded-xl bg-green-500/10 shrink-0">
                <UIcon name="i-simple-icons-whatsapp" class="w-6 h-6 text-green-500" />
              </div>
              <div class="flex-1 space-y-4">
                <div>
                  <p class="font-semibold text-gray-900 dark:text-white">WhatsApp</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Receba alertas urgentes diretamente no seu celular</p>
                </div>
                
                <UInput 
                  v-model="notificationPhone"
                  type="tel"
                  placeholder="+55 11 99999-9999"
                  size="md"
                  icon="i-heroicons-phone"
                />
                
                <label class="flex items-center gap-2 cursor-pointer">
                  <UToggle v-model="whatsappAlerts" size="sm" />
                  <span class="text-sm text-gray-700 dark:text-gray-300">Ativar alertas via WhatsApp</span>
                </label>
                
                <div v-if="whatsappAlerts && notificationPhone" class="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <UIcon name="i-heroicons-information-circle" class="w-4 h-4 shrink-0" />
                  <span class="text-xs">Você receberá uma mensagem de confirmação</span>
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Sticky Save Button -->
        <div class="sticky bottom-4 pt-4">
          <UButton 
            block
            size="lg"
            color="primary"
            :loading="loading"
            icon="i-heroicons-check-circle"
            label="Salvar Configurações de Notificação"
            @click="saveNotificationSettings"
            class="shadow-lg shadow-electric-500/20"
          />
        </div>
      </section>

      <!-- Subscription Section -->
      <section v-if="activeSection === 'subscription'" class="space-y-8">
        <header>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Assinatura</h2>
          <p class="text-gray-600 dark:text-gray-400 text-sm mt-1">Gerencie seu plano e visualize opções de upgrade.</p>
        </header>

        <div v-if="orgPending || plansPending" class="space-y-4">
          <USkeleton class="h-32 w-full rounded-2xl" />
          <USkeleton class="h-48 w-full rounded-2xl" />
        </div>

        <div v-else class="space-y-8">
          <!-- Current Plan -->
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Plano Atual</h3>
            
            <!-- Has a plan -->
            <UCard v-if="organization?.plans" class="bg-gradient-to-br from-electric-500/10 to-transparent border-electric-500/30">
              <div class="flex items-start justify-between">
                <div class="space-y-2">
                  <UBadge color="primary" variant="solid" class="font-bold">Ativo</UBadge>
                  <h3 class="text-2xl font-bold text-gray-900 dark:text-white">{{ organization.plans.name }}</h3>
                  <p class="text-gray-600 dark:text-gray-300 text-sm">{{ organization.plans.description }}</p>
                  
                  <div class="flex items-baseline gap-1 pt-2">
                    <span class="text-3xl font-bold text-gray-900 dark:text-white">R$ {{ Number(organization.plans.price_monthly).toFixed(2).replace('.', ',') }}</span>
                    <span class="text-gray-500 text-sm">/mês</span>
                  </div>
                </div>
                
                <UIcon name="i-heroicons-check-badge" class="w-10 h-10 text-electric-500" />
              </div>

              <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700/50 grid grid-cols-2 gap-4">
                <div>
                  <p class="text-xs text-gray-500 uppercase font-bold">Grupos</p>
                  <p class="text-lg font-bold text-gray-900 dark:text-white">{{ organization.plans.max_groups }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500 uppercase font-bold">Retenção</p>
                  <p class="text-lg font-bold text-gray-900 dark:text-white">{{ organization.plans.retention_days }} dias</p>
                </div>
              </div>
            </UCard>
            
            <!-- No plan - Free tier -->
            <UCard v-else class="bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700">
              <div class="flex items-start justify-between">
                <div class="space-y-2">
                  <UBadge color="gray" variant="soft" class="font-bold">Gratuito</UBadge>
                  <h3 class="text-2xl font-bold text-gray-900 dark:text-white">Plano Free</h3>
                  <p class="text-gray-600 dark:text-gray-300 text-sm">Plano básico para começar</p>
                  
                  <div class="flex items-baseline gap-1 pt-2">
                    <span class="text-3xl font-bold text-gray-900 dark:text-white">R$ 0,00</span>
                    <span class="text-gray-500 text-sm">/mês</span>
                  </div>
                </div>
                
                <UIcon name="i-heroicons-gift" class="w-10 h-10 text-gray-400" />
              </div>

              <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700/50 grid grid-cols-2 gap-4">
                <div>
                  <p class="text-xs text-gray-500 uppercase font-bold">Grupos</p>
                  <p class="text-lg font-bold text-gray-900 dark:text-white">1</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500 uppercase font-bold">Retenção</p>
                  <p class="text-lg font-bold text-gray-900 dark:text-white">7 dias</p>
                </div>
              </div>
              
              <div class="mt-4 p-3 rounded-lg bg-electric-500/10 border border-electric-500/20">
                <p class="text-sm text-electric-600 dark:text-electric-400">
                  <UIcon name="i-heroicons-arrow-up-circle" class="w-4 h-4 inline mr-1" />
                  Faça upgrade para desbloquear mais recursos!
                </p>
              </div>
            </UCard>
          </div>

          <!-- All Plans -->
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Planos Disponíveis</h3>
            
            <div class="grid gap-4">
              <UCard 
                v-for="plan in allPlans" 
                :key="plan.id"
                :class="[
                  'transition-all',
                  isCurrentPlan(plan) 
                    ? 'border-electric-500/50 bg-electric-500/5' 
                    : 'bg-white dark:bg-gray-900/40 hover:border-gray-300 dark:hover:border-gray-700'
                ]"
              >
                <div class="flex items-center justify-between">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <h4 class="font-bold text-gray-900 dark:text-white">{{ plan.name }}</h4>
                      <UBadge v-if="isCurrentPlan(plan)" color="primary" variant="soft" size="xs">Atual</UBadge>
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">{{ plan.description }}</p>
                    <div class="flex items-center gap-4 pt-1 text-xs text-gray-500">
                      <span>{{ plan.max_groups }} grupos</span>
                      <span>{{ plan.retention_days }} dias retenção</span>
                    </div>
                  </div>
                  
                  <div class="text-right">
                    <p class="text-2xl font-bold text-gray-900 dark:text-white">R$ {{ Number(plan.price_monthly).toFixed(2).replace('.', ',') }}</p>
                    <p class="text-xs text-gray-500">/mês</p>
                    
                    <UButton 
                      v-if="!isCurrentPlan(plan)"
                      :label="Number(plan.price_monthly) > (Number(organization?.plans?.price_monthly) || 0) ? 'Fazer Upgrade' : 'Mudar Plano'"
                      :color="Number(plan.price_monthly) > (Number(organization?.plans?.price_monthly) || 0) ? 'primary' : 'gray'"
                      size="sm"
                      class="mt-2"
                      :icon="checkoutLoading === plan.id ? '' : 'i-heroicons-arrow-up-circle'"
                      :loading="checkoutLoading === plan.id"
                      :disabled="checkoutLoading !== null"
                      @click="startCheckout(plan)"
                    />
                  </div>
                </div>
              </UCard>
            </div>
          </div>

          <!-- Invoices Section -->
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Faturas</h3>
            
            <UCard class="bg-white dark:bg-gray-900/40">
              <div class="text-center py-8">
                <UIcon name="i-heroicons-document-text" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p class="text-gray-600 dark:text-gray-400 text-sm">Nenhuma fatura disponível ainda</p>
                <p class="text-gray-500 dark:text-gray-500 text-xs mt-1">As faturas aparecerão aqui após o primeiro pagamento</p>
              </div>
            </UCard>
          </div>
        </div>
      </section>

      <!-- Organization Section -->
      <section v-if="activeSection === 'organization'" class="space-y-8">
        <header>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Organização</h2>
          <p class="text-gray-600 dark:text-gray-400 text-sm mt-1">Configurações da sua organização. Uma organização agrupa suas comunidades monitoradas.</p>
        </header>

        <!-- Info Card -->
        <UCard class="bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20">
          <div class="flex gap-3">
            <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div class="text-sm">
              <p class="font-medium text-blue-900 dark:text-blue-200">O que é uma Organização?</p>
              <p class="text-blue-700 dark:text-blue-300 mt-1">
                Uma organização é seu espaço de trabalho no IgnoHub. Ela agrupa suas comunidades (grupos de WhatsApp/Telegram), 
                possui um plano de assinatura próprio e pode ter múltiplos usuários com diferentes permissões.
              </p>
            </div>
          </div>
        </UCard>

        <div v-if="orgPending" class="space-y-4">
          <USkeleton class="h-12 w-full" />
          <USkeleton class="h-10 w-40" />
        </div>

        <div v-else-if="organization" class="space-y-6">
          <UCard class="bg-white dark:bg-gray-900/40">
            <div class="space-y-6">
              <UFormGroup label="Nome da Organização" hint="Identificação do seu workspace">
                <UInput 
                  v-model="organization.name" 
                  placeholder="Ex: Minha Igreja, Empresa ABC" 
                  size="lg"
                  icon="i-heroicons-building-office"
                />
              </UFormGroup>

              <UButton 
                label="Salvar Alterações" 
                color="primary"
                size="lg"
                :loading="loading"
                icon="i-heroicons-check"
                @click="updateOrg"
              />
            </div>
          </UCard>
        </div>

        <div class="pt-8 border-t border-gray-200 dark:border-gray-800">
          <h3 class="text-sm font-bold text-red-500 uppercase tracking-wide mb-4">Zona de Perigo</h3>
          <UCard class="bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-red-900 dark:text-red-200">Excluir Organização</p>
                <p class="text-sm text-red-700 dark:text-red-300">Esta ação é irreversível e apagará todos os dados</p>
              </div>
              <UButton label="Excluir" color="red" variant="soft" icon="i-heroicons-trash" />
            </div>
          </UCard>
        </div>
      </section>
    </main>
  </div>
</template>
