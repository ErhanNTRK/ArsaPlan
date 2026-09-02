# ArsaPlan v9.14.0 — Kat Karşılığı Sadeleştirme, Akaryakıt Nihai Değer, Yapı Sınıfı Önerisi, Tarımsal Kroki

Doğrulama: `tsc -b` 0 hata · `npx vitest run` **371/371 test yeşil** ·
`npm run build` başarılı. Altı kalem, hepsi kodlandı ve test edildi.

## 1. "Raporu İndir" ekranı ızgaraya taşındı

Üç tik + elle giriş alanı artık daha kompakt bir ızgara düzeninde.

## 2. PDF'te "HESAP VARSAYIMLARI", "Yöntem Karşılaştırması"nın hemen altında

Önceden raporun en altındaydı, şimdi bulgu ile gerekçesi yan yana — "Arsa
Değeri — Yöntem Karşılaştırması" bölümünü okuyan kişi, hemen altında hangi
oranlarla hesaplandığını görüyor.

## 3. Kat Karşılığı ham değeri tamamen kaldırıldı

"Kat Karşılığı Yöntemine Göre Arsa Değeri" (indirgemesiz) PDF, Excel ve
"Raporu İndir" ekranından kaldırıldı — artık yalnızca **İndirgemeli Kat
Karşılığı Değeri** ve **İndirgemeli Gelir Projeksiyonu Değeri** gösteriliyor,
ikisi de aynı zaman temelinde (bugünkü değer), adil bir karşılaştırma.

## 4. Akaryakıt'a Nihai Değer seçici eklendi

Otel modülüyle aynı desen: Gelir Yaklaşımı / Maliyet Yaklaşımı / Manuel.
Seçilen yöntem büyük, öne çıkan kutuda gösteriliyor; diğerleri küçük,
ikincil satırlar hâlinde kalıyor. Manuel seçilirse elle bir TL rakamı
girilebiliyor.

## 5. Yapı Sınıfı otomatik önerisi eklendi

Bağımsız Maliyet Yaklaşımı ve Akaryakıt modüllerinde, Yapı Türü seçildiğinde
—eşleşme varsa— Yapı Sınıfı ve Birim Maliyet artık **sessizce, hiçbir
açıklama/uyarı olmadan** otomatik doluyor. Siz isterseniz elle değiştirirsiniz.

**Kapsam, dürüstçe:** 179 yapı türünün yalnızca 44'ü (bazı isimler kategoriler
arası tekrar ettiği için tekilleşiyor) tebliğ referanslı bir eşleşme buldu —
geri kalanı için hâlâ elle seçim yapmanız gerekiyor, bu bilinçli bir tercih
(yanlış/zorlama bir eşleşme sunmaktansa hiç önermemek daha güvenilir).
**Otel modülüne uygulanmadı** — o modülün Maliyet Yaklaşımı farklı bir veri
yapısı kullanıyor (Yapı Sınıfı kodu hiç yok, düz bir birim maliyet sayısı
var), bu özelliği oraya taşımak ayrı, daha büyük bir iş.

## 6. Tarımsal Ürün Gelir Hesabı'na gerçek parsel krokisi eklendi

KML yüklendiğinde artık diğer modüllerle (Arsa Gelir Projeksiyonu, Otel,
Akaryakıt, Maliyet Yaklaşımı) aynı görsel dilde bir "Parsel Krokisi"
gösteriliyor — önceden yalnızca "(KML)" diye bir metin etiketi vardı, hiçbir
görsel yoktu. KML'in gerçek geometrisi artık saklanıyor (önceden yalnızca
alan sayısı tutuluyordu, şekil bilgisi atılıyordu).

## Hesaplamalarda değişiklik oldu mu?

**Hayır** — altı kalemin hepsi gösterim/arayüz/veri girişi değişikliği,
hiçbir hesap formülüne dokunulmadı.

## Değişen/Eklenen Dosyalar

```
src/ui/Result.tsx                    Kalem 1, 3
src/export/pdf.ts                    Kalem 2, 3
src/export/excel.ts                  Kalem 3
src/engine/types.ts                  Kalem 3 (showKatKarsiligiHam kaldırıldı)
src/fuel/engine.ts                   Kalem 4 (finalMethod/finalManualValue)
src/fuel/pdf.ts                      Kalem 4 (hero yeniden tasarımı)
src/fuel/FuelApp.tsx                 Kalem 4, 5
src/fuel/kalem4-nihai-deger.test.ts  YENİ — 3 test
src/data/yapiTuruEslesme.ts          YENİ — Kalem 5 (44 yapı türü eşleşmesi)
src/data/yapiTuruEslesme.test.ts     YENİ — 5 test
src/cost/CostApproachApp.tsx         Kalem 5
src/agri/engine.ts                   Kalem 6 (AgriInput.kml)
src/agri/pdf.ts                      Kalem 6 (Parsel Krokisi)
src/agri/AgriApp.tsx                 Kalem 6
src/agri/kalem6-kroki.test.ts        YENİ — 2 test
```

## Beklemede — henüz karar verilmedi/kodlanmadı

- **İndirgenmiş Kat Karşılığı Yöntemi** (üç bağımsız banka raporuyla
  doğruladığımız formül) — hâlâ "beklesin" kararınız geçerli.
- **Otel Maliyet Yaklaşımı'na Yapı Sınıfı otomatik önerisi** — veri modeli
  farklı olduğu için ayrı bir iş, henüz onaylanmadı.
