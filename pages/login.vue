<script setup lang="ts">
definePageMeta({
  layout: false
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const loading = ref(false)
const email = ref('')
const password = ref('')
const fullName = ref('')
const isMagicLink = ref(false)
const isRegister = ref(false)

const handleAuth = async () => {
  loading.value = true
  try {
    if (isRegister.value) {
      if (!fullName.value) throw new Error('Por favor, digite seu nome')
      
      const { error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
        options: {
          data: {
            full_name: fullName.value
          }
        }
      })
      if (error) throw error
      alert('Cadastro realizado! Verifique seu e-mail para confirmar.')
      isRegister.value = false
    } else if (isMagicLink.value) {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.value,
        options: {
          emailRedirectTo: window.location.origin
        }
      })
      if (error) throw error
      alert('Link de acesso enviado para o seu e-mail!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value
      })
      if (error) throw error
    }
  } catch (error: any) {
    alert(error.message || 'Erro na autenticação')
  } finally {
    loading.value = false
  }
}

// Redirect if already logged in
watch(user, () => {
  if (user.value) {
    navigateTo('/')
  }
}, { immediate: true })

const toggleMode = () => {
  isRegister.value = !isRegister.value
  isMagicLink.value = false
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
    <div class="w-full max-w-sm space-y-8 p-8 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl dark:shadow-none">
      <div class="text-center">
        <div class="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-electric-400 to-electric-600 rounded-xl mb-4 shadow-lg shadow-electric-500/30">
          <UIcon name="i-heroicons-bolt" class="w-7 h-7 text-white" />
        </div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">IgnoHub</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {{ isRegister ? 'Crie sua conta para começar' : 'Acesse sua conta para continuar' }}
        </p>
      </div>

      <form @submit.prevent="handleAuth" class="space-y-4">
        <UFormGroup v-if="isRegister" label="Nome Completo" name="fullName">
          <UInput
            v-model="fullName"
            type="text"
            placeholder="Seu nome"
            icon="i-heroicons-user"
            color="gray"
            size="lg"
            required
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup label="Email" name="email">
          <UInput
            v-model="email"
            type="email"
            placeholder="seu@email.com"
            icon="i-heroicons-envelope"
            color="gray"
            size="lg"
            required
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup v-if="!isMagicLink" label="Senha" name="password">
          <UInput
            v-model="password"
            type="password"
            placeholder="••••••••"
            icon="i-heroicons-lock-closed"
            color="gray"
            size="lg"
            required
            :disabled="loading"
          />
        </UFormGroup>

        <UButton
          type="submit"
          block
          size="lg"
          color="primary"
          :loading="loading"
        >
          {{ isRegister ? 'Criar Conta' : (isMagicLink ? 'Enviar Link de Acesso' : 'Entrar') }}
        </UButton>
      </form>

      <div class="pt-4 text-center space-y-2">
        <UButton
          v-if="!isRegister"
          variant="link"
          color="gray"
          size="sm"
          block
          @click="isMagicLink = !isMagicLink"
        >
          {{ isMagicLink ? 'Usar senha para entrar' : 'Usar Magic Link (E-mail)' }}
        </UButton>
        
        <div class="relative py-2">
          <div class="absolute inset-0 flex items-center">
            <span class="w-full border-t border-gray-300 dark:border-gray-700" />
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-white dark:bg-gray-900/50 px-2 text-gray-500">Ou</span>
          </div>
        </div>

        <UButton
          variant="link"
          color="gray"
          size="sm"
          block
          @click="toggleMode"
        >
          {{ isRegister ? 'Já tenho uma conta? Entrar' : 'Não tem conta? Cadastre-se' }}
        </UButton>
      </div>
    </div>
  </div>
</template>
