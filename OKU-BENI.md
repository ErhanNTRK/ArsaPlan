# ArsaPlan v9.13.0 — "Site" Seçeneği Kaldırıldı, Parsel Krokisi Boyut Düzeltmesi

Doğrulama: `tsc -b` 0 hata · `npx vitest run` **358/358 test yeşil** ·
`npm run build` başarılı.

## 1. "Site" (parsel içinde çok bloklu) seçeneği kaldırıldı

Konut Proje Tipi seçiminde "Site — yakında hizmette" diye duran, tıklanınca
hiçbir şey olmayan ölü bir kart vardı — hiç uygulanmamış bir özellik için
süresiz bir yer tutucuydu. Kaldırıldı; yalnızca gerçekten çalışan iki
seçenek (Villa, Çok Katlı Bina) kaldı. Bu özellik ileride gerçekten
yapılmak istenirse (parsel krokisinde her bloğun ayrı oturumu, PDF'te blok
bazlı kat/alan dökümü, blok isimlendirme vb.) baştan, düzgün bir özellik
olarak eklenecek.

## 2. Parsel Krokisi — uzun/dar parsellerde artık aşırı büyümüyor

**Kök neden:** Kroki, yüksekliğini parselin en/boy oranına göre hesaplıyordu,
ama genişlik için CSS'te bir üst sınır (460px) varken **yükseklik için hiç
yoktu**. Türkiye'de yaygın olan uzun/dar parsellerde (örn. 20m × 300m gibi
aşırı bir örnekte) bu oran çok büyüyüp krokiyi sayfada devasa bir kutuya
dönüştürebiliyordu.

**Düzeltme:** Yüksekliğe bir üst sınır (genişliğin ~1,4 katı) eklendi.
20m×300m gibi aşırı bir örnekte kroki yüksekliği ~5.348 pikselden
**588 piksele** indi (~%89 daha kompakt) — normal/kareye yakın parsellerde
hiçbir değişiklik yok, şekil hiçbir zaman bozulmuyor (mevcut ölçekleme
mantığı zaten daha kısıtlayıcı boyutu baz alıp diğer eksende otomatik
boşluk bırakıyor).

3 yeni test — biri özellikle şeklin taşmadığını/bozulmadığını da doğruluyor.

## Hesaplamalarda değişiklik oldu mu?

**Hayır** — ikisi de yalnızca arayüz/görünürlük düzeltmesi, hiçbir hesap
mantığına dokunulmadı.

## Değişen/Eklenen Dosyalar

```
src/ui/Steps.tsx                            "Site" seçeneği kaldırıldı
src/engine/types.ts                         HousingType'tan 'site' çıkarıldı
src/ui/ParcelSketch.tsx                     Yükseklik üst sınırı eklendi
src/ui/parcel-sketch-height-cap.test.tsx    YENİ — 3 test
```

## Beklemede — henüz karar verilmedi/kodlanmadı

- **"Nihai Değer" seçici** (Arsa Gelir Projeksiyonu) — onaylandı, "başla" bekliyor.
- **Yapı Sınıfı otomatik önerisi** (179 yapı türü, tebliğ referanslı) — onaylandı, "başla" bekliyor.
- **İndirgenmiş Kat Karşılığı Yöntemi** (minimum veri girişi) — onaylandı, "başla" bekliyor.
- **Ziraat Tablosu bozulması** — araştırma bırakıldı, kapalı.
- **Uzman Notu PDF** — olduğu gibi kalıyor, kapalı.
- **Ticari İşletme Peyzaj/Çevre Düzenlemesi** — olduğu gibi kalıyor, kapalı (arsa değeri taşıyor, mantıklı bulundu).
