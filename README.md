# Motokurye İstanbul

İstanbul motokuryelerinin günlük kararlarını anlatan, Financial Times’ın *The Uber Game* projesinden esinlenen interaktif simülasyon. Şu an **Aşama 1** tamamdır: şematik İstanbul haritası, trafik renkleri, her siparişte birbirinden farklı tam 3 rota ve yolda dinamik rota güncelleme.

> Trafik verisi gerçek zamanlı değildir; senaryoya dayalı simülasyondur.

## Gereksinimler
Node.js 18 veya üzeri.

## Çalıştırma
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/ klasörüne üretim derlemesi
npm run preview    # derlemeyi yerelde dene
npm run typecheck  # isteğe bağlı TypeScript denetimi
```

## Vercel’de yayınlama
1. Klasörü bir Git deposuna gönderin ve Vercel’de **Add New → Project** ile içe aktarın. Ayarlar `vercel.json` içinde hazırdır (Vite, `npm run build`, çıktı `dist`).
2. Ya da terminalden: `npx vercel` (önizleme), `npx vercel --prod` (canlı).

## Dosya yapısı
```
index.html              Giriş sayfası
vite.config.ts          Vite yapılandırması
vercel.json             Vercel ayarları
public/favicon.svg      Site simgesi
src/main.tsx            React girişi
src/App.tsx             Oyun durumu, sipariş/rota/yolculuk akışı
src/styles.css          Tasarım (açık/koyu tema)
src/game/data.ts        Düğümler, yollar, trafik modeli
src/game/routing.ts     Yol ağında 3 farklı rotanın üretimi
src/components/MapView.tsx  SVG harita ve rota çizimi
src/components/Cards.tsx    Rota kartları ve karar butonları
```

## Sonraki aşamalar
Yakıt deposu ve istasyon, giderler, müşteri puanı (Aşama 2); mevsim/hava ve arızalar (3); Three.js ile 3D (4); 365 günlük yıl ve rapor (5).
