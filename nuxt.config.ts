export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@pinia/nuxt',
    '@nuxt/test-utils/module'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    ticketmasterApiKey: process.env.NUXT_TICKETMASTER_API_KEY || 'pLOeuGq2JL05uEGrZG7DuGWu6sh2OnMz',
    ticketmasterBaseUrl: 'https://app.ticketmaster.com/discovery/v2'
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'tr'
      },
      title: 'Etkinlik Keşif',
      meta: [
        { name: 'description', content: 'Ticketmaster Discovery API ile yaklaşan konser, spor ve sanat etkinliklerini keşfedin.' }
      ]
    }
  },

  colorMode: {
    preference: 'light',
    fallback: 'light'
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
