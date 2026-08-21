# ArsaPlan v9.9.0 — Acil Düzeltme Turu: İndirgeme, Parsel Alanı, Kroki, Görsel Anahtarları, Banka Notu

Doğrulama: `tsc -b` 0 hata · `npx vitest run` **346/346 test yeşil** ·
`npm run build` başarılı. Beş kalem, hepsi kodlandı ve test edildi.

## 1. İndirgemeli değer artık yalnız gerçekten indirgenmişse gösteriliyor

Önceki hata: "İndirgemeli Değer" satırlarının görünüp görünmeyeceği yalnızca
**Proje Süresi**'ne bakıyordu, **Yıllık İndirgeme Oranı**'na hiç bakmıyordu.
Yalnız birini doldurup diğerini boş bırakırsanız, gerçek indirgeme
uygulanmadığı hâlde "İndirgemeli Değer" diye bir satır çıkıyor, ama sayı
indirgemesiz değerle birebir aynı oluyordu — kafa karıştırıcıydı. Artık
kontrol her iki alanı da (`ay > 0 VE oran > 0`) gerektiriyor — hem Kat
Karşılığı hem Gelir Projeksiyonu tarafında, hem PDF hem Excel hem ekranda.

## 2. Parsel Alanı artık tam sayıya yuvarlanmıyor

10.000,33 m² gibi tapu kaydından gelen kesin bir rakam, önceden "10.000 m²"
diye tam sayıya yuvarlanıyordu. Yeni bir biçimlendirici (`m2p`/`fmtM2Precise`/
`M2P`) eklendi — yalnız Parsel Alanı (tapu) ve Net Parsel Alanı için 2
ondalık korunuyor; diğer (hesaplanan/tahmini) alanlar okunabilirlik için
hâlâ tam sayıya yuvarlanıyor, bu değişmedi.

## 3. Parsel krokisine TAKS/KAKS modunda taban oturumu eklendi

Daha önce TAKS/KAKS modunda kroki hiçbir zaman bina oturumunu göstermiyordu
— yalnız "Çekme Mesafesi" modunda çiziliyordu. Artık TAKS/KAKS modunda da,
taban oturumu m²'si (TAKS'tan ya da otomatik türetilmişse ondan) parselin
genel oranlarına uygun, ortalanmış temsili bir dikdörtgenle gösteriliyor —
altına "Taban Oturumu (temsili): X m²" notu düşülüyor. Gerçek mimari
yerleşim değil, yalnız büyüklük göstergesi olduğu açık.

## 4. Parsel Krokisi ve Yapı Kesiti artık ayrı ayrı açılıp kapatılabiliyor

Önceden tek bir "PDF'te parsel krokisi ve yapı kesiti" anahtarı ikisini
birlikte kontrol ediyordu. Artık iki ayrı anahtar var — yalnız birini
isteyip diğerini kapatabilirsiniz. Eski taslaklarda (`reportVisuals` hâlâ
girilmiş, yeni alanlar boşsa) eski davranış korunuyor, geriye dönük uyumlu.

## 5. Tutarsızlık notu artık bankaya giden PDF/Excel'e yazılmıyor

Geçen turda eklediğim "%5 tutarlılık uyarısı" (kat karşılığı oranı ile
müteahhit kâr oranı arasındaki olası tutarsızlığı açıklayan not), sistemin
kendi hesaplamasında (ekranda, siz kontrol ederken) kalmaya devam ediyor —
ama artık PDF ve Excel çıktısına hiç yazılmıyor. Bankaya gönderilecek
resmi rapor, yalnız sonuç rakamlarını içeriyor.

## Hesaplamalarda değişiklik oldu mu?

**Hiçbirinde hesap mantığı değişmedi** — yalnızca gösterim/görünürlük
düzeltmeleri. Tek davranış değişikliği: yalnız Proje Süresi VEYA yalnız
İskonto Oranı girip diğerini boş bırakmış olduğunuz raporlarda, artık
"İndirgemeli Değer" satırı hiç görünmeyecek (önceden yanlışlıkla,
indirgemesiz değerle aynı sayıyla görünüyordu) — bu raporları gözden
geçirmek isteyebilirsiniz.

## Değişen Dosyalar

```
src/export/pdf.ts       İndirgeme koşulu, m2p, kroki taban oturumu, ayrı görsel anahtarları, gapExplanation kaldırıldı
src/export/excel.ts     İndirgeme koşulu, M2P, gapExplanation kaldırıldı
src/ui/Result.tsx       İndirgeme koşulu, fmtM2Precise
src/ui/fields.tsx       fmtM2Precise eklendi
src/ui/Steps.tsx        Parsel Krokisi/Yapı Kesiti ayrı anahtarlar (Konut/Ticari/Karma)
src/ui/StepsIsletme.tsx showParcelSketch'e geçirildi
src/engine/types.ts     showParcelSketch, showBuildingSection
src/engine/acil-5-kalem.test.ts   YENİ — 7 test
```

## Beklemede — henüz karar verilmedi

- "İndirgenmiş Kat Karşılığı Yöntemi" (bağımsız Maliyet Yaklaşımı'na üçüncü
  yöntem) — şimdilik eklenmiyor.
