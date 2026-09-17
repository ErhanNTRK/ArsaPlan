# ArsaPlan v9.19.0 — Yan Ürün Gelirinin Sunumu Düzeltildi, Antep Fıstığı Eklendi

Doğrulama: `tsc -b` 0 hata · `npx vitest run` **458/458 test yeşil** ·
`npm run build` başarılı (59 test dosyası).

## Erhan'ın PDF ekran görüntüsüyle bulduğu sorun düzeltildi

Tarımsal Ürün Gelir Hesabı'nda, yan ürünü olan bir kalemde (örn. Mısır +
Sap/Koçan), ana ürün satırında kalın gösterilen rakam **zaten** ana+yan
ürün toplamıydı — ama hemen altında yan ürünün kendi neti de ayrıca
gösterildiği için, "yan ürünün ayrıca toplama eklenmesi gerekiyor" gibi
yanlış bir izlenim veriyordu.

**Hesabın kendisi hiçbir zaman yanlış değildi** — yalnızca sunum
netleştirildi:

```
ÖNCEDEN:
  Mısır                                  403.886 TL   (zaten toplam, ama belirsiz)
    + Yan ürün: Mısır Sapı / Koçanı       40.389 TL   (ek mi, dahil mi belirsiz)

ŞİMDİ:
  Mısır                                  363.497 TL   (yalnızca ana ürün)
    + Yan ürün: Mısır Sapı / Koçanı       40.389 TL
    = Toplam (ana + yan ürün)            403.886 TL   (kalın, açıkça etiketli)
```

Hem PDF hem Excel çıktısında aynı düzeltme uygulandı.

## Antep Fıstığı eklendi (muhafazakar değerlerle)

Tarımsal Ürün Gelir Hesabı kataloğuna. Erhan'ın geri bildirimi: ilk
denenen varsayılan (10 kg/ağaç) saha tecrübesine göre yüksek çıkıyordu
— varsayılan **6 kg/ağaç**'a, gider oranı **%35**'e çekildi (kıraç/orta
bakımlı arazi ağırlıklı, muhafazakar bir "sektör ortalaması"). Fiyat
(700 TL/kg, Şanlıurfa Ticaret Borsası) değişmedi.

## Değişen Dosyalar

```
src/agri/pdf.ts                          Yan ürün etiketi düzeltildi
src/agri/excel.ts                        Yan ürün etiketi düzeltildi
src/agri/catalog.ts                      Antep Fıstığı (muhafazakar)
src/agri/antep-fistigi.test.ts           5 test
src/agri/kalem7-yan-urun-toplam-etiketi.test.ts   4 test (yeni)
```
