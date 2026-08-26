# Evently

Ticketmaster Discovery API 2.0 üzerinden Türkiye pazarındaki gerçek etkinlik verisini (bilet linkleri çoğunlukla Biletix) çeken, Nuxt 4 + Nuxt UI ile yazılmış etkinlik keşif uygulaması.

Marka: **Evently**. Bilet konsepti: **Admit One**.

## Özellikler

- Yaklaşan etkinlikleri listeleme
- Kartlarda ad, görsel, tarih, şehir, mekan ve kategori
- Arama, şehir / kategori / tarih filtreleri, sıralama ve sayfalama
- Etkinlik detayı: etkinlik, sanatçı ve mekan bilgisi
- Takvime ekle (.ics) ve Google Takvim
- Bağlantı paylaşımı
- Etkinlik detayında görsel galerisi
- Favorileri tarihe göre sıralama
- SEO (Open Graph + JSON-LD)
- Ticketmaster yanıtları için sunucu önbelleği
- Yükleniyor, hata ve boş durumları
- Koyu / açık tema
- TypeScript ve Zod doğrulaması
- Temel birim testleri

## Kurulum

```bash
npm install
cp .env.example .env
```

`.env` içine Ticketmaster API anahtarınızı yazın:

```
NUXT_TICKETMASTER_API_KEY=your_key
```

Anahtar: [Ticketmaster Developer Portal](https://developer.ticketmaster.com/)

API dokümantasyonu: [Discovery API v2](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/)

Geliştirme sunucusu:

```bash
npm run dev
```

Adres: `http://localhost:3000`

Canlı site: https://etkinlik-kesif-uygulamasi.vercel.app

## Vercel ortam değişkeni

Ticketmaster anahtarı tarayıcıya gitmez; yalnızca sunucuda okunur.

1. [Vercel Dashboard](https://vercel.com) > proje > **Settings** > **Environment Variables**
2. `NUXT_TICKETMASTER_API_KEY` ekleyin (Production / Preview / Development)
3. Redeploy edin

Anahtar yoksa `/api/events` 500 döner.

## Komutlar

```bash
npm run dev
npm run build
npm run test
npm run lint
npm run typecheck
```

## Proje yapısı

```
app/
  pages/
    index.vue
    events/index.vue
    events/[id].vue
    favorites.vue
  components/
    EventCard.vue
    EventList.vue
    EventFilters.vue
    EventSearch.vue
    AppHeader.vue
  composables/
    useEvents.ts
    useVenues.ts
    useClassifications.ts
  stores/
    favorites.ts
  types/
    event.ts
server/api/
shared/utils/
```

Nuxt 4 kaynak dizinini `app/` altında tutar.
