export default defineNuxtRouteMiddleware((to) => {
    const user = useSupabaseUser()

    // Se não estiver logado e tentar acessar qualquer rota exceto /login, redireciona
    if (!user.value && to.path !== '/login') {
        return navigateTo('/login')
    }

    // Se estiver logado e tentar acessar /login, redireciona para o dashboard
    if (user.value && to.path === '/login') {
        return navigateTo('/')
    }
})
