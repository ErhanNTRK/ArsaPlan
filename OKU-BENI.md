# ArsaPlan v9.3.0 — Otel Gelir Hesabı: Maliyet Yaklaşımı'na Yasal/Mevcut Durum Ayrımı

Doğrulama: `tsc -b` 0 hata · `npx vitest run` **271/271 test yeşil** ·
`npm run build` başarılı.

## Otel Gelir Hesabı — Maliyet Yaklaşımı çapraz kontrolüne Yasal/Mevcut Durum eklendi

Daha önce bağımsız **Maliyet Yaklaşımı modülünde** kurduğumuz Yasal/Mevcut
Durum ayrımı, Otel Gelir Hesabı'nın **kendi içindeki** küçük Maliyet
Yaklaşımı çapraz kontrol bölümüne hiç taşınmamıştı — orada yalnız tek bir
yapı listesi vardı. Artık orada da aynı, nötr isimlendirilmiş mekanizma var
(hiçbir yerde "kaçak/ruhsatsız" gibi bir ifade geçmiyor):

- **"Mevcut Durum Değeri Hesapla"** anahtarı — varsayılan kapalı.
- Açılırsa Yasal Durum'daki yapı satırları aşağıya kopyalanır; burada
  bağımsız olarak değiştirilebilir, silinebilir, yeni satır eklenebilir.
  Kapalı kalırsa Mevcut Durum, Yasal Durum ile birebir aynı görünür.
- Mevcut Durum için ayrı, opsiyonel bir Şerefiye tutarı da girilebilir —
  boş bırakılırsa Yasal Durum'unki kullanılır.
- Ekran, PDF ve Excel'in üçünde de, açıksa **iki ayrı** Maliyet Yaklaşımı
  değeri (Yasal Durum / Mevcut Durum) gösteriliyor; kapalıysa eskisi gibi
  tek değer.

Gerçek testlerle doğrulandı: kapalıyken iki durumun birebir eşit olduğu,
bağımsız yapı satırlarıyla doğru ayrıştığı, ayrı şerefiye tutarının doğru
kullanıldığı (4 test) — ve gerçek bir PDF+Excel üretilip içeriğinde "YASAL
DURUM" / "MEVCUT DURUM" bölümlerinin gerçekten göründüğü (1 test) kontrol
edildi.

## Hesaplamalarda değişiklik oldu mu?

Hayır — bu özellik yalnızca **opsiyonel, kapalı başlayan** yeni bir alan.
Kapatılmış (varsayılan) durumdaki hiçbir mevcut raporun sonucu değişmedi.

## Değişen/Eklenen Dosyalar

```
src/hotel/types.ts            HotelIncomeInput'a computeMevcutDurum/mevcutCostBuildings/mevcutCostGoodwill; HotelIncomeResult.cost'a current
src/hotel/engine.ts           Yasal/Mevcut Durum maliyet hesabı
src/hotel/HotelApp.tsx        "Mevcut Durum Değeri Hesapla" anahtarı + düzenlenebilir ikinci yapı listesi
src/hotel/pdf.ts              Yasal/Mevcut Durum ayrı bölümler
src/hotel/excel.ts            Yasal/Mevcut Durum ayrı bölümler
src/hotel/yasal-mevcut-cost.test.ts  YENİ — 5 test
```

## Yükleme

`src` / `public` / `package.json` klasör ve dosyalarını GitHub'a sürükle —
önce kök dosyalar, sonra ayrı ayrı `src`, sonra ayrı ayrı `public`, sonra
ayrı ayrı `.github` (dördü tek seferde değil). Actions yeşile dönünce
Ctrl+F5.
