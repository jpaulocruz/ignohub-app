export default defineNuxtRouteMiddleware((to) => {
    const user = useSupabaseUser()

    // Rotas públicas que não requerem autenticação
    const publicRoutes = ['/login', '/register', '/confirm', '/forgot-password']

    // Verifica se a rota atual está na lista de rotas públicas
    const isPublicRoute = publicRoutes.includes(to.path)

    if (import.meta.server) {
        console.log(`[Middleware] SSR - Path: ${to.path} - User defined: ${!!user.value}`)
    } else {
        console.log(`[Middleware] Client - Path: ${to.path} - User defined: ${!!user.value}`)
    }

    // Se não estiver logado e tentar acessar uma rota protegida
    if (!user.value && !isPublicRoute) {
        return navigateTo('/login')
    }

    // Se estiver logado e tentar acessar login ou register
    if (user.value && (to.path === '/login' || to.path === '/register')) {
        return navigateTo('/')
    }
})
