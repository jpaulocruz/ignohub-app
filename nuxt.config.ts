// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxtjs/supabase', '@vueuse/nuxt'],
  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/login', '/register'],
    },
    cookieOptions: {
      maxAge: 60 * 60 * 8,
      sameSite: 'lax',
      secure: false
    },
    serviceKey: process.env.SUPABASE_SECRET_KEY,
  },
  runtimeConfig: {
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    }
  },
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' }
      ]
    }
  },
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
    storageKey: 'nuxt-color-mode'
  },
  compatibilityDate: '2024-11-01',
  nitro: {
    externals: {
      inline: ['h3']
    }
  },
  devtools: { enabled: true }
})
