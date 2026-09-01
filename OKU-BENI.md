# ArsaPlan v9.10.0 — Arayüz Sıkılaştırma + Çok-Sayfalı JPEG + Formül Düzeltmeleri

Doğrulama: `tsc -b` 0 hata · `npx vitest run` **346/346 test yeşil** · `npm run build` başarılı.

## Bu turun kalemleri (hepsi doğrudan uygulandı, kesin zip'te)

1. **Kâr ve Finansman, Günümüze İndirgeme, Kat Karşılığı Analizi, Rapor Görselleri** bölümleri artık ızgara düzeninde (daha az yer kaplıyor).
2. **Finansman Gideri ipucu düzeltildi** — "Kredi yoksa %0 bırakın" kaldırıldı (yanlıştı — %0, sermayenin bedava olduğunu varsayar, arsa değerini %55'e varan oranda şişirebiliyordu, gerçek hesapla doğruladık). Yeni metin: paranın maliyeti, %10-20 önerilir.
3. **Yıllık İndirgeme Oranı ipucu düzeltildi** — önceki "TCMB %35-38 nominal" tavsiyesi, satış fiyatını büyütmeden nominal oranla indirgeyince "çifte ceza" hatasına yol açıyordu. Artık **reel (enflasyondan arındırılmış) oran, %8-15** öneriliyor.
4. **Üst özet şerit artık o an geçerli TÜM yöntemleri canlı gösteriyor** — Gelir Projeksiyonu (ham/indirgemeli) ve Kat Karşılığı (ham/indirgemeli), hangileri aktifse.
5. **JPEG çıktısı artık PDF'in TÜM sayfalarını, ayrı dosyalar olarak indiriyor** (`Sayfa1.jpg`, `Sayfa2.jpg`, ...) — önceden yalnızca 1. sayfayı veriyordu. Hem ana Arsa Gelir Projeksiyonu hem bağımsız Maliyet Yaklaşımı modülünde düzeltildi. Düğme "Özet JPEG" → "JPEG (Sayfa Sayfa)" oldu.

## Hesaplamalarda değişiklik oldu mu?

**Hayır** — bu tur yalnızca arayüz düzeni, metin/ipucu doğruluğu ve JPEG kapsamı ile ilgili. Hiçbir hesap formülü değişmedi.

## Değişen Dosyalar

```
src/ui/Steps.tsx            Kâr ve Finansman / Günümüze İndirgeme / Kat Karşılığı Analizi / Rapor Görselleri ızgara + metin düzeltmeleri
src/App.tsx                 Üst özet şerit — tüm geçerli yöntemler
src/export/jpeg.ts          Çok sayfalı JPEG (ana modül)
src/cost/jpeg.ts            Çok sayfalı JPEG (bağımsız Maliyet Yaklaşımı)
src/ui/Result.tsx           JPEG düğme etiketi ve ipucu metni
src/cost/CostApproachApp.tsx JPEG düğme etiketi
src/i18n/index.ts           Yeni JPEG etiketinin İngilizce çevirisi
src/ui/ui.test.tsx          Test güncellendi (yeni düğme etiketi)
```

## Beklemede — henüz karar verilmedi/kodlanmadı

- **"Nihai Değer" seçici** (Arsa Gelir Projeksiyonu) — onaylandı, "başla" bekliyor.
- **Yapı Sınıfı otomatik önerisi** (179 yapı türü, tebliğ referanslı) — onaylandı, "başla" bekliyor.
- **İndirgenmiş Kat Karşılığı Yöntemi** (minimum veri girişi — yalnız "Proje Riski" yeni alanı) — onaylandı, "başla" bekliyor.
- **Ziraat Tablosu bozulması** — sizin bildirdiğiniz sorun, test senaryomda tekrarlanmadı; siz "sonra tekrar deneriz" dediniz, açık.
- **Uzman Notu PDF** — "gereksiz" izleniminiz netleşmedi (içerik testte dolu çıktı); ister isteğe bağlı ekran içi gösterime çevirebiliriz, karar bekliyor.
