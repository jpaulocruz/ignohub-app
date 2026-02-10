<script setup lang="ts">
import type { Database } from '../types/database.types'

const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()
const config = useRuntimeConfig()
const toast = useToast()
const { validateOrg } = useOrgSecurity()

// Local State
const loading = ref(false)
const checkoutLoading = ref<string | null>(null)
const activeSection = ref('profile')

// Form States
const profileData = ref({
  full_name: '',
  avatar_url: '',
  website: ''
})

const notificationSettings = ref({
  email_alerts: true,
  whatsapp_number: ''
})

const passwordData = ref({
  newPassword: '',
  confirmPassword: ''
})

// Organization & Plan Info
const selectedOrgId = useCookie('selected_organization_id')
const { data: organization, refresh: refreshOrg } = useLazyAsyncData('settings-org', async () => {
  const orgId = selectedOrgId.value
  if (!orgId || orgId === 'undefined' || orgId === 'null') return null
  const { data } = await supabase
    .from('organizations')
    .select('*, plans(*)')
    .eq('id', orgId)
    .single() as any
  return data
})

// Invoices
const { data: invoices, pending: invoicesLoading } = useFetch('/api/stripe/invoices', {
  lazy: true,
  server: false,
  watch: [selectedOrgId]
})

// Initial Load
const loadUserData = async () => {
  if (!user.value) return

  // 1. Load from profiles table
  const userId = user.value.id
  if (!userId || userId === 'undefined' || userId === 'null') return

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, website')
    .eq('id', userId)
    .single() as any

  if (profile) {
    profileData.value = {
      full_name: profile.full_name || '',
      avatar_url: profile.avatar_url || '',
      website: profile.website || ''
    }
  }

  // 2. Load from user_metadata
  const metadata = user.value.user_metadata
  notificationSettings.value = {
    email_alerts: metadata?.email_alerts ?? true,
    whatsapp_number: metadata?.whatsapp_number || ''
  }
}

onMounted(async () => {
  console.log('Config:', config.public)
  await validateOrg()
  await loadUserData()
  
  // Handle success param from Stripe
  const route = useRoute()
  if (route.query.success === 'true') {
    toast.add({ title: 'Assinatura atualizada com sucesso!', color: 'emerald' })
    activeSection.value = 'subscription'
  }
})

// Actions
const saveProfile = async () => {
  if (!user.value) return
  loading.value = true

  try {
    // 1. Upsert Profile
    const userId = user.value.id
    if (!userId || userId === 'undefined' || userId === 'null') {
      throw new Error('ID de usuário inválido')
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ 
        id: userId,
        full_name: profileData.value.full_name,
        avatar_url: profileData.value.avatar_url,
        website: profileData.value.website,
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      if (profileError.code === '42501') {
        throw new Error('Sem permissão para editar perfil')
      }
      throw profileError
    }

    // 2. Update Auth Metadata (for notifications, etc)
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name: profileData.value.full_name,
        email_alerts: notificationSettings.value.email_alerts,
        whatsapp_number: notificationSettings.value.whatsapp_number
      }
    })

    if (authError) throw authError

    toast.add({ title: 'Perfil atualizado!', color: 'emerald' })
  } catch (e: any) {
    const description = e.message.includes('permission') ? 'Sem permissão para editar' : e.message
    toast.add({ title: 'Erro ao salvar perfil', description, color: 'red' })
  } finally {
    loading.value = false
  }
}

const changePassword = async () => {
  if (passwordData.value.newPassword !== passwordData.value.confirmPassword) {
    toast.add({ title: 'As senhas não coincidem', color: 'orange' })
    return
  }

  loading.value = true
  try {
    const { error } = await supabase.auth.updateUser({
      password: passwordData.value.newPassword
    })

    if (error) throw error

    toast.add({ title: 'Senha alterada com sucesso!', color: 'emerald' })
    passwordData.value = { newPassword: '', confirmPassword: '' }
  } catch (e: any) {
    toast.add({ title: 'Erro ao trocar senha', description: e.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

const startCheckout = async (planType: 'starter' | 'pro') => {
  if (!selectedOrgId.value) return
  checkoutLoading.value = planType

  try {
    const orgId = selectedOrgId.value
    if (!orgId || orgId === 'undefined' || orgId === 'null') {
      toast.add({ title: 'Organização não selecionada', color: 'red' })
      return
    }

    const { url } = await $fetch<{ url: string }>('/api/stripe/create-checkout', {
      method: 'POST',
      body: { 
        planType, 
        organizationId: orgId 
      }
    })

    if (url) window.location.href = url
  } catch (e: any) {
    toast.add({ title: 'Erro ao iniciar checkout', description: e.message, color: 'red' })
  } finally {
    checkoutLoading.value = null
  }
}

const plans = computed(() => [
  {
    name: 'Starter',
    slug: 'starter',
    priceId: config.public.stripePriceStarter,
    price: '97',
    features: ['Até 3 grupos', 'Alertas Críticos', 'Resumo Diário IA']
  },
  {
    name: 'Pro',
    slug: 'pro',
    priceId: config.public.stripePricePro,
    price: '197',
    features: ['Até 10 grupos', 'Sentiment Analysis Deep', 'Insights de Membros', 'Suporte Prioritário']
  }
])

const settingsSections = [
  { id: 'profile', label: 'Perfil', icon: 'i-heroicons-user-circle' },
  { id: 'security', label: 'Segurança', icon: 'i-heroicons-shield-check' },
  { id: 'notifications', label: 'Notificações', icon: 'i-heroicons-bell' },
  { id: 'subscription', label: 'Assinatura', icon: 'i-heroicons-credit-card' }
]
</script>

<template>
  <div class="flex flex-col md:flex-row min-h-screen">
    <!-- Navigation Sidebar -->
    <aside class="md:w-64 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 p-6 space-y-8">
      <h1 class="text-2xl font-black text-white px-2">Configurações</h1>
      <nav class="space-y-1">
        <button
          v-for="section in settingsSections"
          :key="section.id"
          @click="activeSection = section.id"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all"
          :class="[
            activeSection === section.id 
              ? 'bg-electric-500/10 text-electric-400' 
              : 'text-gray-400 hover:bg-gray-900/50 hover:text-white'
          ]"
        >
          <UIcon :name="section.icon" class="w-5 h-5" />
          {{ section.label }}
        </button>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-6 md:p-12 max-w-4xl mx-auto">
      
      <!-- Profile Section -->
      <section v-if="activeSection === 'profile'" class="space-y-8">
        <div class="space-y-2">
          <h2 class="text-2xl font-bold text-white">Dados Pessoais</h2>
          <p class="text-gray-400 text-sm">Atualize suas informações básicas de identificação.</p>
        </div>

        <UCard class="bg-gray-900/40 border-gray-800 rounded-3xl">
          <div class="space-y-6">
            <UFormGroup label="Nome Completo">
              <UInput v-model="profileData.full_name" placeholder="Seu nome" size="lg" />
            </UFormGroup>
            
            <UFormGroup label="Email (Não alterável)">
              <UInput :model-value="user?.email" disabled size="lg" class="opacity-50" />
            </UFormGroup>

            <UFormGroup label="Website">
              <UInput v-model="profileData.website" placeholder="https://exemplo.com" size="lg" />
            </UFormGroup>

            <UButton 
              label="Salvar Alterações" 
              color="primary" 
              size="lg" 
              block 
              class="font-bold"
              :loading="loading"
              @click="saveProfile"
            />
          </div>
        </UCard>
      </section>

      <!-- Security Section -->
      <section v-if="activeSection === 'security'" class="space-y-8">
        <div class="space-y-2">
          <h2 class="text-2xl font-bold text-white">Segurança</h2>
          <p class="text-gray-400 text-sm">Gerencie o acesso à sua conta.</p>
        </div>

        <UCard class="bg-gray-900/40 border-gray-800 rounded-3xl">
          <template #header>
            <h3 class="font-bold text-white">Trocar Senha</h3>
          </template>
          <div class="space-y-6">
            <UFormGroup label="Nova Senha">
              <UInput v-model="passwordData.newPassword" type="password" size="lg" />
            </UFormGroup>
            <UFormGroup label="Confirmar Nova Senha">
              <UInput v-model="passwordData.confirmPassword" type="password" size="lg" />
            </UFormGroup>
            <UButton 
              label="Atualizar Senha" 
              color="gray" 
              variant="solid" 
              block 
              class="font-bold" 
              :loading="loading"
              @click="changePassword"
            />
          </div>
        </UCard>
      </section>

      <!-- Notifications Section -->
      <section v-if="activeSection === 'notifications'" class="space-y-8">
        <div class="space-y-2">
          <h2 class="text-2xl font-bold text-white">Notificações</h2>
          <p class="text-gray-400 text-sm">Configurações de alerta e comunicação.</p>
        </div>

        <UCard class="bg-gray-900/40 border-gray-800 rounded-3xl">
          <div class="space-y-6">
            <div class="flex items-center justify-between p-4 bg-gray-950/50 rounded-2xl border border-gray-800">
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-envelope" class="text-electric-400 w-5 h-5" />
                <div>
                  <p class="text-sm font-bold text-white">Alertas por Email</p>
                  <p class="text-xs text-gray-500">Receba notificações críticas no seu email.</p>
                </div>
              </div>
              <UToggle v-model="notificationSettings.email_alerts" />
            </div>

            <UFormGroup label="Número do WhatsApp (Alertas)">
              <UInput 
                v-model="notificationSettings.whatsapp_number" 
                placeholder="+55 11 99999-9999" 
                size="lg" 
              />
            </UFormGroup>

            <UButton 
              label="Salvar Preferências" 
              color="primary" 
              size="lg" 
              block 
              class="font-bold"
              :loading="loading"
              @click="saveProfile"
            />
          </div>
        </UCard>
      </section>

      <!-- Subscription Section -->
      <section v-if="activeSection === 'subscription'" class="space-y-12">
        <div class="space-y-2">
          <h2 class="text-2xl font-bold text-white">Assinatura</h2>
          <p class="text-gray-400 text-sm">Plano atual: <span class="text-electric-400 font-bold uppercase">{{ organization?.plans?.name || 'Gratuito' }}</span></p>
        </div>

        <div class="grid md:grid-cols-2 gap-6">
          <UCard 
            v-for="plan in plans" 
            :key="plan.slug"
            class="bg-gray-900/40 border-gray-800 hover:border-gray-700 transition-all rounded-3xl flex flex-col"
            :class="{ 'ring-2 ring-electric-500/50 bg-electric-500/5': organization?.plans?.id === plan.priceId }"
          >
            <template #header>
              <div class="text-center space-y-1">
                <h3 class="text-lg font-black text-white">{{ plan.name }}</h3>
                <p class="text-2xl font-black text-white">R$ {{ plan.price }}<span class="text-sm font-normal text-gray-400">/mês</span></p>
              </div>
            </template>

            <ul class="space-y-3 mb-8 flex-1">
              <li v-for="feature in plan.features" :key="feature" class="flex items-center gap-2 text-sm text-gray-400">
                <UIcon name="i-heroicons-check-circle" class="text-emerald-500 w-5 h-5" />
                {{ feature }}
              </li>
            </ul>

            <UButton 
              :label="!plan.priceId ? 'Configuração de Preço Indisponível' : (organization?.plans?.id === plan.priceId ? 'Plano Atual' : 'Assinar Agora')" 
              :color="organization?.plans?.id === plan.priceId ? 'gray' : 'primary'"
              variant="solid"
              block
              class="font-black h-12 rounded-2xl transition-all"
              :disabled="organization?.plans?.id === plan.priceId || !plan.priceId || checkoutLoading !== null"
              :loading="checkoutLoading === plan.slug"
              @click="startCheckout(plan.slug as 'starter' | 'pro')"
            />
          </UCard>
        </div>

        <!-- Invoices Table -->
        <div class="space-y-6">
          <div class="space-y-1">
            <h3 class="text-xl font-bold text-white">Últimas Faturas</h3>
            <p class="text-sm text-gray-400">Histórico de pagamentos e downloads de PDF.</p>
          </div>

          <UCard class="bg-gray-900/40 border-gray-800 rounded-3xl overflow-hidden">
            <div v-if="invoicesLoading" class="p-8 space-y-4">
              <USkeleton v-for="i in 3" :key="i" class="h-12 w-full bg-gray-800/50 rounded-xl" />
            </div>
            
            <div v-else-if="!invoices?.length" class="p-12 text-center space-y-3">
              <UIcon name="i-heroicons-document-text" class="w-12 h-12 text-gray-700 mx-auto" />
              <p class="text-gray-500 font-bold">Nenhuma fatura encontrada.</p>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="w-full text-left">
                <thead class="bg-gray-950/50 border-b border-gray-800">
                  <tr>
                    <th class="px-6 py-4 text-xs font-black uppercase text-gray-500">Data</th>
                    <th class="px-6 py-4 text-xs font-black uppercase text-gray-500">Valor</th>
                    <th class="px-6 py-4 text-xs font-black uppercase text-gray-500">Status</th>
                    <th class="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-800">
                  <tr v-for="invoice in invoices" :key="invoice.id" class="hover:bg-gray-800/20 transition-colors">
                    <td class="px-6 py-4 text-sm text-white font-medium">{{ invoice.date }}</td>
                    <td class="px-6 py-4 text-sm text-white font-black">{{ invoice.amount }}</td>
                    <td class="px-6 py-4">
                      <UBadge 
                        :label="invoice.status" 
                        :color="invoice.status === 'paid' ? 'emerald' : 'orange'" 
                        variant="soft"
                        class="capitalize rounded-lg font-bold"
                      />
                    </td>
                    <td class="px-6 py-4 text-right">
                      <UButton
                        v-if="invoice.pdf"
                        :to="invoice.pdf"
                        target="_blank"
                        icon="i-heroicons-arrow-down-tray"
                        color="gray"
                        variant="ghost"
                        size="xs"
                        class="rounded-xl"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </UCard>
        </div>
      </section>

    </main>
  </div>
</template>
