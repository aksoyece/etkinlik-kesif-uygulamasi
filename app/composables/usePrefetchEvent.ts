/**
 * Kart tıklamasında detay API’sini ısıtır (hover yok).
 * Tekilleştirilmiş cache: aynı ID için tekrar istek yok.
 */
export function prefetchEventDetail(id: string | undefined | null) {
  if (!id) {
    return
  }
  warmEventDetailCache(id)
}

export function getEventDetailPrefetch(id: string): Promise<unknown> | undefined {
  return getEventDetailInflight(id)
}
