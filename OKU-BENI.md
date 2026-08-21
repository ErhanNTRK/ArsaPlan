# ArsaPlan v9.7.0 — TAKS Boşken Otomatik Taban Oturumu Türetme

Doğrulama: `tsc -b` 0 hata · `npx vitest run` **333/333 test yeşil** ·
`npm run build` başarılı.

## TAKS girilmemişse, taban oturumu artık otomatik türetiliyor

Daha önce TAKS boş bırakılırsa taban oturumu sıfır kalıyordu, yalnız bir
uyarı çıkıyordu — hesap orada tıkanıyordu. Artık:

- **Kat Sayısı** (zaten var olan, "kaç kat üstü yapı" alanı) ve **Emsal
  Alanı**'ndan taban oturumu otomatik hesaplanıyor. Çatı katı emsale dahil
  ve oranlıysa (varsayılan davranış), formül buna göre ayarlanıyor:
  `Taban Oturumu = Emsal Alanı ÷ (Kat Sayısı + Çatı Katı Oranı)`.
- Ekranda bu önerilen değer ve nereden geldiği açıkça gösteriliyor.
- **Yeni "Taban Oturumu (elle, opsiyonel)" alanı** eklendi — önerilen
  değeri beğenmezseniz kendi rakamınızı girebilirsiniz. Girdiğinizde,
  **Kat Sayısı emsali tam tüketecek şekilde otomatik yeniden hesaplanıyor**
  (örn. önerilen 1.000 m²'yi 900 m²'ye çekerseniz, gereken kat sayısı
  otomatik artıyor) — ekranda bu yeni kat sayısı da gösteriliyor.
- TAKS zaten giriliyorsa hiçbir şey değişmiyor, bu özellik yalnız TAKS boş
  bırakıldığında devreye giriyor.

Denizli/Merkefendi/Çakmak örneğinizin gerçek sayılarıyla (10.000,33 m²
parsel, Emsal 1,45, 12 kat, %35 çatı oranı) test edildi — elle
hesapladığımız sonuçla birebir örtüşüyor. 7 yeni test.

## Hesaplamalarda değişiklik oldu mu?

**Yalnızca TAKS boş bırakılmış projeleri etkiler.** TAKS her zaman
girildiği (mevcut kullanımınızın büyük kısmı) hiçbir mevcut rapor
değişmiyor — bu, yalnızca önceden "hesaplanamıyor" diye tıkanan bir
senaryoyu artık çalışır hâle getiriyor.

## Değişen Dosyalar

```
src/engine/types.ts      Zoning.footprintOverride, CapacityResult.footprintSuggested/effectiveFloorsAboveGround
src/engine/capacity.ts   Otomatik türetme + elle geçersiz kılma mantığı
src/engine/index.ts      İki hardcoded CapacityResult güncellendi (apartman/işletme hatları)
src/engine/taks-otomatik-turetme.test.ts   YENİ — 7 test
src/ui/Steps.tsx         "Taban Oturumu (elle)" alanı + güncellenmiş yönlendirici not
```

## Beklemede — henüz karar verilmedi

- "İndirgenmiş Kat Karşılığı Yöntemi" (bağımsız Maliyet Yaklaşımı'na üçüncü
  yöntem) — şimdilik eklenmiyor.
