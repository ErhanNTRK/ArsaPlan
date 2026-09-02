# ArsaPlan v9.12.0 — Otel İNA Yuvarlama Tutarsızlığı Düzeltildi

Doğrulama: `tsc -b` 0 hata · `npx vitest run` **355/355 test yeşil** ·
`npm run build` başarılı.

## İNA (NBD) artık diğer iki yöntemle tutarlı, 5.000'e yuvarlanıyor

Siz üç yöntemi (Direkt Kap, İNA, Maliyet Yaklaşımı) aynı PDF'te
gösterttiğinizde, ikisi (Direkt Kap, Maliyet Yaklaşımı) temiz, 5.000'in
katı rakamlar veriyordu — ama **İNA hiç yuvarlanmıyordu**, "4.397.200,00"
gibi kesirli/kusuratlı bir sonuç veriyordu. Bu yüzden siz üstteki nihai
rakamı elle yazmak zorunda kalmıştınız.

**Kök neden:** `capitalizedValue` ve `cost.totalValueRounded` kodda zaten
`Math.round(x / 5000) * 5000` ile yuvarlanıyordu; `ina.npv` ise ham
(indirgenmiş nakit akışlarının toplamı) olarak, hiç yuvarlanmadan
dönüyordu — üçü aynı raporda yan yana gösterildiğinde tutarsız görünüyordu.

**Düzeltme:** `npv` de artık aynı 5.000 kuralıyla yuvarlanıyor. 2 yeni test
— biri özellikle üçünün **aynı anda** 5.000'in katı çıktığını doğruluyor.

Ayrıca bu değişiklik nedeniyle, terminal değer düzeltmesini doğrulayan eski
bir golden testin (`engine.test.ts`) toleransı, ham hassasiyetten (kuruşa
kadar) ±2.500 TL'lik (yarım yuvarlama adımı) bir toleransa güncellendi —
testin asıl doğruladığı şey (terminal değer hesabının doğruluğu) hiç
değişmedi, yalnız artık yuvarlamayı da hesaba katıyor.

## Hesaplamalarda değişiklik oldu mu?

**Evet, ama yalnızca son basamaklarda** — İNA sonucunuz artık en yakın
5.000'e yuvarlanıyor (önceden tam kuruşuna kadar kesin bir sayıydı). Fark,
en fazla ±2.500 TL — büyük ölçekli otel değerlemelerinde ihmal edilebilir
düzeyde, ama artık üç yöntem birbiriyle görsel olarak tutarlı.

## Değişen/Eklenen Dosyalar

```
src/hotel/engine.ts                 npv artık R5000 ile yuvarlanıyor
src/hotel/engine.test.ts            Golden test toleransı güncellendi
src/hotel/ina-npv-yuvarlama.test.ts    YENİ — 2 test
```

## Beklemede — henüz karar verilmedi/kodlanmadı

- **"Nihai Değer" seçici** (Arsa Gelir Projeksiyonu) — onaylandı, "başla" bekliyor.
- **Yapı Sınıfı otomatik önerisi** (179 yapı türü, tebliğ referanslı) — onaylandı, "başla" bekliyor.
- **İndirgenmiş Kat Karşılığı Yöntemi** (minimum veri girişi) — onaylandı, "başla" bekliyor.
- **Ziraat Tablosu bozulması** — test senaryomda tekrarlanmadı, açık.
- **Uzman Notu PDF** — karar bekliyor.
