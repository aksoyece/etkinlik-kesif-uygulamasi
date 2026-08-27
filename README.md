# Evently

Ticketmaster Discovery API 2.0 ile Birleşik Krallık (UK / `countryCode=GB`) pazarındaki gerçek etkinlikleri listeleyen etkinlik keşif uygulaması.

- **Stack:** Nuxt 4 · Nuxt UI · TypeScript · Pinia · Zod · Vitest  
- **Marka:** Evently · **Bilet konsepti:** Admit One  
- **Repo:** https://github.com/aksoyece/etkinlik-kesif-uygulamasi  
- **Canlı:** https://etkinlik-kesif-uygulamasi.vercel.app  

Aktif market `shared/utils/market.ts` üzerinden yönetilir; TR tanımı ileride seçenek olarak hazırdır.

## Özellikler

- Ticketmaster Discovery API üzerinden gerçek ve yaklaşan etkinlikleri listeleme
- Etkinlik kartlarında ad, görsel, tarih, şehir, mekan ve kategori bilgileri
- Canlı arama ve autocomplete
- Şehir, kategori ve tarih filtreleri
- Etkinlikleri tarih ve diğer kriterlere göre sıralama
- Pagination / sayfalama
- Etkinlik detay sayfası
- Detay sayfasında etkinlik, sanatçı ve mekan bilgileri
- Benzer etkinlik önerileri
- Etkinlik görsel galerisi ve oturma planı
- Favorilere etkinlik ekleme ve çıkarma
- Favorilerin Pinia ile yönetilmesi ve Local Storage'da kalıcı tutulması
- API işlemlerinin Nuxt composable yapısı ile yönetilmesi
- Loading, error ve empty state durumları
- Nuxt UI componentleri
- Responsive tasarım
- Koyu / açık tema
- TypeScript ile tip güvenliği
- Zod ile gerekli doğrulama işlemleri
- Takvime ekleme (.ics ve Google Takvim)
- Etkinlik bağlantısı paylaşma
- SEO (Open Graph + JSON-LD)
- Ticketmaster API yanıtları için sunucu önbelleği
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
API: [Discovery API v2](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/)

```bash
npm run dev
```

Adres: `http://localhost:3000`

## Vercel ortam değişkeni

Ticketmaster anahtarı tarayıcıya gitmez; yalnızca sunucuda okunur.

1. [Vercel Dashboard](https://vercel.com) → proje → **Settings** → **Environment Variables**
2. `NUXT_TICKETMASTER_API_KEY` ekleyin (Production / Preview / Development)
3. Redeploy edin

Anahtar yoksa `/api/events` 500 döner.

## Teslim notu: “Bilet al” / Ticketmaster

Uygulama **etkinlik keşif** amaçlıdır. “Ticketmaster’da bilet al” butonu Discovery API’den gelen resmi bilet URL’sini yeni sekmede açar; ödeme Evently içinde yapılmaz.

`queue-it.net` / `queueittoken` içeren oturuma özel URL’ler kaydedilmez. UK pazarında Ticketmaster bazen Queue-it ile erişim kısıtı gösterebilir; bu satıcı tarafı bir durumdur.

Değerlendirme için kısa kontrol:

- Keşfet / Etkinlikler listesi, arama, filtre, sıralama, sayfalama
- Etkinlik detayı (sanatçı + mekan), favori (Pinia + localStorage)
- Loading / error / empty, dark-light, responsive
- “Ticketmaster’da bilet al” dış siteye gider

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
    index.vue              # Keşfet (öne çıkanlar, arama, popüler isimler)
    events/index.vue       # Katalog: arama, filtre, sıralama, pagination
    events/[id].vue        # Detay
    favorites.vue          # Favoriler
  components/
    EventCard.vue
    EventList.vue
    EventFilters.vue
    EventSearch.vue
    AppHeader.vue
    AppFooter.vue
    PopularArtists.vue
    QuickSearchResults.vue
    …
  composables/
    useEvents.ts           # Liste + detay + explorer
    useVenues.ts
    useClassifications.ts
    usePopularArtists.ts
    useSimilarEvents.ts
    …
  stores/
    favorites.ts           # Pinia + localStorage
  types/
    event.ts
server/api/
  events.get.ts
  events/[id].get.ts
  venues/[id].get.ts
  classifications.get.ts
shared/utils/
test/                      # Vitest birim testleri
```

Nuxt 4 kaynak dizinini `app/` altında tutar.

---

© 2026 Evently · Designed & developed by Ece Aksoy
