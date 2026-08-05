# ArsaPlan v7.7.0 — Otel Düzeltmeleri + Doğrulanmış Tarım Kataloğu

Doğrulama: tsc 0 hata, test 193/193, build başarılı.

## Otel Gelir Hesabı

1. **`loadDraft()` veri kaybı hatası düzeltildi.** Maliyet Yaklaşımı,
   döviz, nihai yöntem seçimi gibi alanlar artık tarayıcı taslağından
   doğru geri yükleniyor (önceden bu alanlar sessizce sıfırlanıyordu).
2. **Risksiz Getiri Oranı / Risk Primi ipuçları güncellendi** — Türkiye
   gerçeğine (%35-38 / %3-8) göre, **döviz seçimine göre dinamik**:
   TL seçiliyse Türkiye rakamları, USD/EUR seçiliyse çok daha düşük
   döviz bazlı rakamlar gösteriliyor.
3. **Gelir Artış / Gider Artış / Kapitalizasyon Oranı ipuçları** aynı
   şekilde Türkiye/döviz duyarlı hale getirildi.
4. **Terminal Kap. Oranı artık Kapitalizasyon Oranı ile senkron/
   salt-okunur geliyor** — "Farklı gir" bağlantısına tıklayan isterse
   ayrı bir değer girebiliyor.

## Tarımsal Ürün Kataloğu

**Buğday (16,5 TL/kg) ve Arpa (12,75 TL/kg) TMO'nun 2026 resmi alım
fiyatlarıyla doğrulandı** — artık tahmin değil, gerçek kaynak.

Diğer ~20 ürünün fiyat/verim/gider oranları, Gemini ve ChatGPT'nin
verdiği önerilerin orta noktası alınarak güncellendi (Mısır, Ayçiçeği,
Pamuk, tüm meyveler, sebzeler).

**Metodolojik düzeltmeler:**
- Küspeler **"(işlenmiş ürün)"** olarak yeniden adlandırıldı — tarlada
  değil, yağ/çırçır fabrikasında elde edildiği notu eklendi.
- Bağlarda (Sofralık/Şaraplık/Kurutmalık Üzüm) artık ayrı bir
  **"ekonomik ömür"** kavramı var (30 yıl), "yatırım geri dönüş süresi"
  (8 yıl) ile karıştırılmıyor.
- Kurutmalık Üzüm notu netleştirildi: verim/fiyat **kurutulmuş** ürün
  baz alınarak eşleştirildi, yaş üzüm verimiyle karıştırılmamalı uyarısı
  güçlendirildi.

**Dürüstlük notu:** Kod incelemesinde fark ettim — kataloğun `years` ve
yeni `economicLifeYears` alanları şu an **uygulama ekranında hiç
gösterilmiyor/kullanılmıyor**, yalnızca kod içinde belgeleniyor. Forma
gerçekten yansıyan alanlar `yieldPerUnit`, `price`, `expensePct` — bu
üçü doğru güncellendi ve etkili.

## Bu turda YAPILMAYAN (bilerek atlandı, sen onayladın)

- Madde 6 (tutarlılık ipucu metni) — istemedin, eklenmedi.
- Madde 7 (aşırı veri girişi uyarı eşikleri) — örnek olarak vermiştin,
  atlandı.
- Madde 8 (üzüm çeşitleri: Sultaniye vb.) — sonraya bırakıldı.

## Yükleme
`src`/`public`/`package.json` → GitHub Upload files → üzerine yaz →
Commit → Actions yeşile dönene kadar bekle → Ctrl+F5.
