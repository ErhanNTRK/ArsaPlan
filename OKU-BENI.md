# ArsaPlan v9.16.0 — Ayrıntılı Üst Hakkı PDF Yeniden Tasarımı, Banka/Şube/Tarih Şeridi (7 Modül)

Doğrulama: `tsc -b` 0 hata · `npx vitest run` **412/412 test yeşil** ·
`npm run build` başarılı.

## 1-2. Ayrıntılı Üst Hakkı PDF'i yeniden tasarlandı

- **"TAŞINMAZ DEĞERİ" artık raporun en başında** — diğer tüm modüllerle
  (Arsa Gelir Projeksiyonu, Otel, Akaryakıt) tutarlı. Önceden Kimlik →
  Süre/Para Birimi → Maliyet Yaklaşımı → Dönemsel Tablo'dan (birkaç sayfa
  sürebilen) sonra, en altta görünüyordu.
- **Motorun hesapladığı 5 gelir + 13 gider kalemi artık PDF'te görünüyor.**
  Önceden yalnızca "Toplam Gelir/Toplam Gider" gösteriliyordu — banka
  Excel'ine birebir doğrulanmış olan bu ayrıntı motorun içinde duruyordu
  ama rapora hiç yansımıyordu. Artık dört ayrı detay tablosu var: Gelir
  Kalemleri Detayı, İşletme Giderleri Detayı, Sabit Giderler Detayı,
  Üst Hakkı Sahibine Özgü Ödemeler.
- Bu süreçte gerçek bir hata da bulundu ve düzeltildi: `.toUpperCase()`
  Türkçe karakterleri (İ/I, Ş, Ğ) yanlış büyütüyordu (`"yiyecek"` →
  `"YIYECEK"`, doğrusu `"YİYECEK"`); artık elle doğru yazılmış Türkçe
  büyük harfli etiketler kullanılıyor.

## 3. Banka İsmi / Şube İsmi / Tarih şeridi — yedi modülün hepsine

Ortak, tek bir `drawBankInfoStrip()` fonksiyonu (export/pdf.ts) — hepsi
aynı görsel dili paylaşıyor. Üç alan da opsiyonel; en az biri doluysa,
raporun **en başında** (başlığın hemen altında) açık gri bir şerit olarak
gösterilir. Hiçbiri doldurulmazsa, hiçbir modülde hiçbir şey değişmez.

**Kapsanan yedi modül:** Arsa Gelir Projeksiyonu, Otel Gelir Analizi,
Akaryakıt Gelir Hesabı, Bağımsız Maliyet Yaklaşımı, Tarımsal Ürün Gelir
Hesabı, Üst Hakkı (Basit Mod — Toplam/Arsa Değeri Esaslı), Üst Hakkı
(Ayrıntılı/Detaylı Mod).

**Not:** Akaryakıt, Tarımsal, Üst Hakkı (Basit ve Ayrıntılı) modüllerinde
"Rapor Tarihi" özelliği de bu turda ilk kez eklendi — önceden bu dört
modülde hiç yoktu.

**Kullanılmayan bir dosya bulundu:** `usthakki/pdf.ts` (`UstHakkiApp.tsx`
ile birlikte) App.tsx'te hiçbir yere yönlendirilmemiş, ölü kod — bu tura
dahil edilmedi.

## Hesaplamalarda değişiklik oldu mu?

**Hayır** — üç kalemin hepsi gösterim/arayüz/veri girişi değişikliği,
hiçbir hesap formülüne dokunulmadı.

## Değişen/Eklenen Dosyalar

```
src/usthakki/detailedPdf.ts                 Kalem 1, 2 — yeniden tasarım
src/usthakki/kalem1-2-pdf-yeniden-tasarim.test.ts  YENİ — 3 test

src/export/pdf.ts                           drawBankInfoStrip() eklendi + Arsa Gelir Projeksiyonu entegrasyonu
src/ui/Result.tsx                            Banka/Şube UI
src/engine/types.ts                          bankName/branchName alanları

src/hotel/types.ts, HotelApp.tsx, pdf.ts     Otel entegrasyonu
src/fuel/engine.ts, FuelApp.tsx, pdf.ts      Akaryakıt entegrasyonu (+ Rapor Tarihi ilk kez)
src/cost/engine.ts, CostApproachApp.tsx, pdf.ts   Maliyet Yaklaşımı entegrasyonu
src/agri/engine.ts, AgriApp.tsx, pdf.ts      Tarımsal entegrasyonu (+ Rapor Tarihi ilk kez)
src/usthakki/SimpleUstHakkiApp.tsx, simplePdf.ts   Üst Hakkı Basit (+ Rapor Tarihi ilk kez)
src/usthakki/detailedEngine.ts, DetailedUstHakkiApp.tsx, detailedPdf.ts   Üst Hakkı Ayrıntılı (+ Rapor Tarihi ilk kez)

src/export/kalem3-banka-serit.test.ts        YENİ — 8 test (ortak fonksiyon + 3 modülde gerçek PDF doğrulaması)
```

## Beklemede — henüz kesin karar verilmedi

- **Üst Hakkı "Basit Mod"** (Otel modülünden veri aktaran, sadeleştirilmiş
  hesap) — tartışma aşamasında, kesin onay bekliyor.

## Kapanan konular

- ~~İndirgenmiş Kat Karşılığı Yöntemi~~ — vazgeçildi, bir daha gündeme gelmeyecek.
