# ArsaPlan v9.3.0 — Otel Adım 1 Yeniden Tasarımı + Arsa Gelir Projeksiyonu Düzeltmeleri

Doğrulama: `tsc -b` 0 hata · `npx vitest run` **266/266 test yeşil** ·
`npm run build` başarılı. Bu tur, önceki "5 düzeltme notu" turunun devamı —
o turda Otel modülünde bulunan Direkt Kap/İNA ve döviz sorunları
düzeltilmişti; bu turda hem Otel'in Adım 1 ekranı yeniden tasarlandı hem de
Arsa Gelir Projeksiyonu'nda konuşarak netleştirdiğimiz düzeltmeler
tamamlandı.

## 1. Otel Gelir Hesabı — Adım 1 yeniden tasarlandı (yatay, kompakt)

Eskiden 3 ayrı büyük kutu (Para Birimi / Tesis Bilgileri / Taşınmaz Kimliği)
dikey istiflenmişti, sayfa gereksiz uzundu. Artık:

- **Tek yatay şerit:** İl · İlçe · Mahalle · Ada · Parsel · İşletme İsmi ·
  Para Birimi (döviz seçilirse Kur alanı da aynı şeride eklenir) — hepsi tek
  satırda, kutucuklar küçültülmedi (mevcut `.pfield` deseni, min 120px
  garantili).
- **"Hazır Profil ile Başla"** artık `<details>` ile varsayılan **kapalı**
  geliyor, başlığa tıklanınca açılıyor — tamamen kaldırılmadı, yalnız
  katlandı.
- **Oda Tipleri / Yardımcı Gelir / Ticari Kira** satırlarında dikey boşluk
  azaltıldı (satır aralığı ve iç boşluk küçültüldü, okunabilirlik korunarak).
- Varsayılan İşletme Gider Oranı **%35 → %60**.

## 2. Arsa Gelir Projeksiyonu — final değerler 5.000'e yuvarlanıyor

`residualLandValueRounded`, `discountedLandValueRounded`,
`shareLandValueRounded` alanları motora eklendi (diğer modüllerdeki
`R5000` deseniyle birebir tutarlı). Ekran, PDF ve Excel'deki **ana/final**
arsa değeri satırları artık bu yuvarlanmış değerleri gösteriyor — ama birim
m² değeri ve fark oranı gibi ara hesaplar hâlâ **ham** değerden türetiliyor,
oranlar bozulmuyor. Gerçekçi bir senaryoyla (Pendik/Kurtköy, bu sohbette
daha önce Python ile elle doğruladığımız örnek — sonuç aynı büyüklük
aralığında çıktı) çapraz doğrulandı.

## 3. Arsa Gelir Projeksiyonu — Tapu Alanı / Net Alan ayrı gösterimi

Tapu alanı (`parcel.area`) ile terk sonrası net alan (`parcel.netArea`)
**farklıysa**, ekran/PDF/Excel'de artık ikisi ayrı ayrı, kendi birim m²
değerleriyle gösteriliyor:

```
Tapu Alanı: 1.000 m² → 25.000 TL/m²
Net Alan: 850 m² → 29.412 TL/m²
```

İkisi **eşitse** eskisi gibi tek satır kalıyor, gereksiz tekrar olmuyor.
Gerçek bir Excel üretip içeriği okuyarak (hem farklı hem eşit alan
senaryosunda) doğrulandı.

## 4. Türkçe sayı girişi düzeltildi (gerçek, ciddi hata)

Eski kod yalnızca `raw.replace(',', '.')` yapıyordu. "1.234,56" gibi hem
binlik nokta hem ondalık virgül içeren bir girişte bu, "1.234.56" üretip
`parseFloat`'ın yalnızca "1.234" (yani 1,234) kısmını okumasına yol
açıyordu — **~1000 kat küçük bir değer**, fark edilmeden rapora gidebilirdi.

Yeni `parseLocaleNumber()` fonksiyonu:
- "1.234,56" (TR) → 1234.56
- "1,234.56" (US) → 1234.56
- "21.050" (TR binlik, ondalık yok) → 21050 — **akıllı tespit:** tam 3 haneli
  gruplar hâlinde nokta varsa binlik ayracı sayılır; "21.05" gibi 2 haneli
  bir ondalık ise dokunulmaz.
- Negatif değerler, boş/geçersiz girdi (→0) doğru işleniyor.

11 gerçek test senaryosuyla doğrulandı, bu sohbette defalarca kullandığımız
"21.050 TL/m²" gibi gerçek örnekler dahil.

## 5. Housekeeping (düşük öncelikli, "bana bırakıldı" dediğiniz kalemler)

- Taslak kayıt anahtarı `arsaplan-taslak-v7` → `arsaplan-taslak-v9`.
- README.md'ye v6.1'den v9.3.0'a kadarki (Maliyet Yaklaşımı, Ziraat Tablosu,
  Otel üç yöntem, bu turun tamamı) özet sürüm notları eklendi — önceden en
  son v6.0.0'da kalmıştı.

## Hesaplamalarda değişiklik oldu mu?

**2, 3, 5. kalemler hayır** — yalnız gösterim/yuvarlama, mevcut hesap
mantığına dokunulmadı. **4. kalem (sayı parse düzeltmesi) evet, ama yalnız
düzeltici yönde:** yalnızca "1.234,56" gibi hem binlik hem ondalık ayracı
birlikte içeren girişlerde daha önce yanlış (küçük) hesaplanan değerler
artık doğru okunacak — bu girdiyi kullanmayan hiçbir rapor etkilenmez.
**1. kalem (Adım 1 tasarımı)** yalnız görsel, veri modeline dokunmuyor.

## Değişen/Eklenen Dosyalar

```
src/hotel/HotelApp.tsx      Adım 1 yeniden tasarımı, Hazır Profil accordion
src/ui/styles.css           .h-row, .isletme-row kompakt satır yüksekliği
src/hotel/engine.ts         Varsayılan işletme gider oranı %60
src/ui/fields.tsx           parseLocaleNumber() — Türkçe sayı ayrıştırıcı
src/ui/fields.test.ts       YENİ — 11 test
src/engine/financial.ts     residualLandValueRounded, discountedLandValueRounded, shareLandValueRounded
src/engine/types.ts         FinancialResult/ShareResult'a yuvarlanmış alanlar
src/engine/index.ts         İşletme hattı için yuvarlanmış alan varsayılanları
src/engine/rounding.test.ts YENİ — 4 test
src/ui/Result.tsx           Final değerler + Tapu/Net Alan ayrı gösterimi
src/export/pdf.ts           Yuvarlanmış değerler + Tapu/Net Alan notu
src/export/excel.ts         Yuvarlanmış değerler + Tapu/Net Alan satırları
src/export/advicePdf.ts     Yuvarlanmış değer
src/export/dual-area.test.ts YENİ — 2 test
src/App.tsx                 Taslak anahtarı v9
README.md                   v6.1-v9.3.0 sürüm notları eklendi
```

## Yükleme

`src` / `public` / `package.json` klasör ve dosyalarını GitHub'a sürükle —
**önce kök dosyalar (klasörlere dokunmadan, ~11 dosya), sonra `src`
klasörünün kendisi, sonra `public`, sonra `.github`** — dördü ayrı ayrı,
tek seferde sürüklemeyin (100 dosya sınırı uyarısı çıkar). Her turdan sonra
Actions sekmesinde yeşile dönmesini bekleyin. Son turdan sonra Ctrl+F5.
