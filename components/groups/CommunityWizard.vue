<script setup lang="ts">
const emit = defineEmits(['close', 'success'])

const steps = [
  { id: 'agent', title: 'Agente', icon: 'i-heroicons-user-plus' },
  { id: 'instructions', title: 'Instruções', icon: 'i-heroicons-information-circle' },
  { id: 'verify', title: 'Verificação', icon: 'i-heroicons-check-circle' }
]

const currentStep = ref(0)
const loading = ref(false)
const selectedAgent = ref<any>(null)

const client = useSupabaseClient()
const selectedOrgId = useCookie('selected_organization_id')

const { data: presets } = await useAsyncData('agent-presets', async () => {
  const { data } = await client.from('agent_presets').select('*')
  return data
})

const nextStep = () => {
  if (currentStep.value < 2) currentStep.value++
}

const prevStep = () => {
  if (currentStep.value > 0) currentStep.value--
}

const selectAgent = (agent: any) => {
  selectedAgent.value = agent
  nextStep()
}

const startVerification = async () => {
  currentStep.value = 2
  loading.value = true
  
  // Simulação de verificação de webhook/bot entrando no grupo
  setTimeout(async () => {
    try {
      const { error } = await client.from('groups').insert({
        organization_id: selectedOrgId.value,
        name: 'Novo Grupo ' + (selectedAgent.value?.name || ''),
        platform: 'WhatsApp',
        preset_id: selectedAgent.value?.id,
        is_active: true
      })
      
      if (error) throw error
      
      loading.value = false
      emit('success')
    } catch (e) {
      alert('Erro ao confirmar entrada do agente.')
      loading.value = false
      currentStep.value = 1
    }
  }, 3000)
}
</script>

<template>
  <UModal :model-value="true" @close="$emit('close')" prevent-close>
    <UCard class="bg-gray-900 border-gray-800 shadow-2xl">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-white tracking-tight">Adicionar Comunidade</h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="$emit('close')" />
        </div>
        <!-- Progress Bar -->
        <div class="mt-4 flex items-center justify-between px-2">
          <div v-for="(step, index) in steps" :key="step.id" class="flex-1 flex flex-col items-center gap-2 relative">
            <div 
              class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 z-10"
              :class="[
                currentStep >= index ? 'bg-electric-500 text-white' : 'bg-gray-800 text-gray-500 shadow-inner'
              ]"
            >
              <UIcon v-if="currentStep > index" name="i-heroicons-check" class="w-4 h-4" />
              <span v-else>{{ index + 1 }}</span>
            </div>
            <span class="text-[9px] uppercase tracking-widest font-bold" :class="currentStep >= index ? 'text-gray-300' : 'text-gray-500'">
              {{ step.title }}
            </span>
            <!-- Connector Line -->
            <div v-if="index < steps.length - 1" class="absolute h-[1px] top-3.5 left-1/2 w-full bg-gray-800 -z-0">
               <div class="h-full bg-electric-500 transition-all duration-500" :style="{ width: currentStep > index ? '100%' : '0%' }" />
            </div>
          </div>
        </div>
      </template>

      <!-- Step 0: Agent Selection -->
      <div v-if="currentStep === 0" class="space-y-4 py-2">
        <p class="text-xs text-gray-400 font-medium">Escolha o especialista que deseja adicionar ao seu grupo.</p>
        <div class="grid grid-cols-2 gap-3">
          <UButton
            v-for="preset in presets"
            :key="preset.id"
            variant="ghost"
            class="h-auto flex flex-col items-start p-4 border border-gray-800 hover:border-electric-500 hover:bg-electric-500/5 text-left group transition-all"
            @click="selectAgent(preset)"
          >
            <UIcon :name="preset.icon" class="w-8 h-8 text-electric-500 mb-2 group-hover:scale-110 transition-transform" />
            <span class="font-bold text-white text-sm tracking-tight">{{ preset.name }}</span>
            <span class="text-[10px] text-gray-500 leading-tight block mt-1 line-clamp-2">{{ preset.description }}</span>
          </UButton>
        </div>
      </div>

      <!-- Step 1: Instructions -->
      <div v-if="currentStep === 1" class="space-y-6 py-2">
        <div class="bg-gray-800/30 border border-gray-800 p-4 rounded-xl flex items-start gap-4 shadow-inner">
          <div class="p-2.5 bg-electric-500/10 rounded-lg shrink-0">
            <UIcon name="i-heroicons-chat-bubble-left-right" class="w-6 h-6 text-electric-500" />
          </div>
          <div>
            <p class="text-sm font-bold text-white mb-1 tracking-tight">Adicione o Agente no WhatsApp</p>
            <p class="text-[11px] text-gray-400 leading-relaxed font-medium">
              Salve o contato abaixo e adicione o <span class="text-white font-bold">{{ selectedAgent?.name }}</span> como administrador no grupo que deseja monitorar.
            </p>
          </div>
        </div>

        <div class="text-center bg-gray-950/50 p-6 rounded-2xl border border-gray-800 shadow-xl border-dashed">
          <p class="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black mb-3">Contato do Agente</p>
          <div class="inline-flex items-center gap-4 text-2xl font-mono text-electric-400 font-bold tracking-tighter">
             {{ selectedAgent?.contact_info }}
             <UButton icon="i-heroicons-clipboard" color="gray" variant="ghost" size="xs" class="hover:bg-electric-500/10 hover:text-white" />
          </div>
        </div>

        <div class="flex items-center gap-3 px-4 py-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
           <UIcon name="i-heroicons-sparkles" class="w-5 h-5 text-blue-400 shrink-0" />
           <p class="text-[11px] text-blue-300 font-medium">O bot enviará uma mensagem de boas-vindas assim que estiver ativo.</p>
        </div>
      </div>

      <!-- Step 2: Verifying -->
      <div v-if="currentStep === 2" class="py-12 flex flex-col items-center justify-center text-center space-y-6">
        <div class="relative scale-110">
          <div class="absolute -inset-4 bg-electric-500/10 rounded-full blur-xl animate-pulse" />
          <UIcon name="i-heroicons-arrow-path" class="w-16 h-16 text-electric-500 animate-spin" />
          <div class="absolute inset-0 flex items-center justify-center">
            <UIcon :name="selectedAgent?.icon" class="w-8 h-8 text-white opacity-80" />
          </div>
        </div>
        <div class="space-y-2">
          <h4 class="text-lg font-bold text-white tracking-tight">Escaneando o Grupo...</h4>
          <p class="text-xs text-gray-400 font-medium max-w-[280px] mx-auto leading-relaxed">Aguardando sinal do {{ selectedAgent?.name }}. Isso deve levar apenas alguns segundos após a adição.</p>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-between">
          <UButton 
            v-if="currentStep > 0 && !loading" 
            color="gray" 
            variant="ghost" 
            label="Voltar" 
            icon="i-heroicons-arrow-left"
            @click="prevStep" 
            class="text-xs font-bold"
          />
          <div class="flex-1" />
          <UButton
            v-if="currentStep === 1"
            color="primary"
            label="Já adicionei, verificar"
            trailing-icon="i-heroicons-check"
            @click="startVerification"
            class="px-6 font-bold"
          />
        </div>
      </template>
    </UCard>
  </UModal>
</template>
