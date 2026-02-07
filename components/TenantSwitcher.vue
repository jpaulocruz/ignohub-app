<script setup lang="ts">
const client = useSupabaseClient()
const user = useSupabaseUser()
const selectedId = useCookie('selected_organization_id')
const toast = useToast()

const { data: organizations, refresh: refreshOrgs } = await useAsyncData(
  () => `user-organizations-${user.value?.id}`,
  async () => {
    console.log('[TenantSwitcher] Fetching orgs for user:', user.value?.id)
    if (!user.value?.id) return []
    const { data, error } = await client
      .from('organizations')
      .select('id, name')
    
    if (error) {
      console.error('[TenantSwitcher] Error fetching orgs:', error)
      return []
    }
    console.log('[TenantSwitcher] Orgs fetched:', data)
    return data
  }, { watch: [user] }
)

// Auto-create organization if user has none (MVP: 1 org per account)
const autoCreating = ref(false)
watch([organizations, user], async ([orgs, currentUser]) => {
  // Only run if user is logged in, has no orgs, and not already creating
  if (currentUser?.id && orgs?.length === 0 && !autoCreating.value) {
    autoCreating.value = true
    try {
      // Create default organization
      const { data: newOrg, error: orgError } = await client
        .from('organizations')
        .insert({ name: 'Minha Organização' })
        .select()
        .single()

      if (orgError) throw orgError

      // Link user as admin
      const { error: userError } = await client
        .from('organization_users')
        .insert({
          organization_id: newOrg.id,
          user_id: currentUser.id,
          role: 'admin'
        })

      if (userError) throw userError

      // Set as selected and refresh
      selectedId.value = newOrg.id
      await refreshOrgs()
    } catch (err) {
      console.error('Failed to auto-create organization:', err)
    } finally {
      autoCreating.value = false
    }
  }
}, { immediate: true })

// Auto-select first organization if none selected OR if selected is not in list
watch(organizations, (orgs) => {
  console.log('[TenantSwitcher] Reviewing selection. SelectedID:', selectedId.value, 'Orgs:', orgs)
  if (orgs?.length) {
    const isValid = orgs.find(o => o.id === selectedId.value)
    if (!selectedId.value || !isValid) {
      console.log('[TenantSwitcher] Auto-selecting first valid org:', orgs[0].id)
      selectedId.value = orgs[0].id
      if (!isValid && selectedId.value) {
        // If it was invalid, reload to ensure app state is consistent
        window.location.reload()
      }
    }
  }
}, { immediate: true })

const selected = computed(() => {
  if (!organizations.value?.length) return null
  return organizations.value.find(org => org.id === selectedId.value) || organizations.value[0]
})

const selectOrg = (org: any) => {
  selectedId.value = org.id
  window.location.reload()
}

const showModal = ref(false)
const loading = ref(false)
const newOrgName = ref('')

const createOrganization = async () => {
  if (!newOrgName.value) return
  
  loading.value = true
  try {
    // 1. Criar a Organização
    const { data: org, error: orgError } = await client
      .from('organizations')
      .insert({ name: newOrgName.value })
      .select()
      .single()

    if (orgError) throw orgError

    // 2. Vincular o usuário como Admin (RLS deve permitir se configurado corretamente, 
    // mas aqui estamos inserindo na tabela de junção)
    const { error: userError } = await client
      .from('organization_users')
      .insert({
        organization_id: org.id,
        user_id: user.value?.id,
        role: 'admin'
      })

    if (userError) throw userError

    toast.add({ title: 'Organização criada com sucesso!', color: 'emerald' })
    selectedId.value = org.id
    showModal.value = false
    newOrgName.value = ''
    
    // Refresh e Reload
    await refreshOrgs()
    window.location.reload()
  } catch (err: any) {
    toast.add({ title: 'Erro ao criar organização', description: err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

const dropdownItems = computed(() => {
  return [
    organizations.value?.map(org => ({
      label: org.name,
      icon: 'i-heroicons-building-office',
      active: org.id === selectedId.value,
      click: () => selectOrg(org)
    })) || []
  ]
})
</script>

<template>
  <div>
    <UDropdown v-if="selected" :items="dropdownItems" :popper="{ placement: 'bottom-start' }">
      <UButton color="gray" variant="ghost" class="text-sm font-medium hover:bg-gray-800/50">
        <template #leading>
          <UIcon name="i-heroicons-building-office" class="w-4 h-4 text-gray-400" />
        </template>
        {{ selected.name }}
        <template #trailing>
          <UIcon name="i-heroicons-chevron-up-down" class="w-4 h-4 text-gray-400" />
        </template>
      </UButton>
    </UDropdown>
    
    <!-- Show nothing if no organization - MVP only supports one org created on signup -->

    <!-- Modal de Criação -->
    <UModal v-model="showModal">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-800' }" class="bg-gray-900 border border-gray-800">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-white leading-6">Nova Organização</h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="showModal = false" />
          </div>
        </template>

        <div class="p-4 space-y-4">
          <UFormGroup label="Nome da Organização" help="O nome que identifica sua conta multitenant.">
            <UInput v-model="newOrgName" placeholder="Ex: Acme Corp" autofocus @keyup.enter="createOrganization" />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton label="Cancelar" color="gray" variant="ghost" @click="showModal = false" />
            <UButton 
              label="Criar Agora" 
              color="primary" 
              class="font-bold" 
              :loading="loading" 
              :disabled="!newOrgName"
              @click="createOrganization" 
            />
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
