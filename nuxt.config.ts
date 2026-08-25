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

  app: {
    head: {
      htmlAttrs: {
        lang: 'tr'
      },
      title: 'Admit One - Etkinlik Keşif',
      meta: [
        { name: 'description', content: 'Ticketmaster Discovery API ile yaklaşan konser, spor ve sanat etkinliklerini bilet stub estetiğiyle keşfedin.' },
        // 11. Meta/OG görseli: Sosyal medyada paylaşım için Open Graph ve Twitter meta verileri
        { property: 'og:title', content: 'Admit One - Etkinlik Keşif Uygulaması' },
        { property: 'og:description', content: 'Yaklaşan konser, spor ve sanat etkinliklerini bilet stub estetiğiyle keşfedin.' },
        { property: 'og:image', content: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&h=630&fit=crop&q=80' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Admit One - Etkinlik Keşif' },
        { name: 'twitter:description', content: 'Yaklaşan konser, spor ve sanat etkinliklerini bilet stub estetiğiyle keşfedin.' },
        { name: 'twitter:image', content: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&h=630&fit=crop&q=80' }
      ],
      link: [
        // 10. Favicon: Sekme ikonu bilet temasına uygun özel bir SVG ikon yapıldı
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  // 1. Tema (renk modu): Koyu tema varsayılan olarak sabitlendi
  colorMode: {
    preference: 'dark',
    fallback: 'dark'
  },

  runtimeConfig: {
    ticketmasterApiKey: process.env.NUXT_TICKETMASTER_API_KEY || 'pLOeuGq2JL05uEGrZG7DuGWu6sh2OnMz',
    ticketmasterBaseUrl: 'https://app.ticketmaster.com/discovery/v2'
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
