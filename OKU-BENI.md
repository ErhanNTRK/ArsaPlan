# ArsaPlan v9.2.0 — Maliyet Yaklaşımı: Yasal/Mevcut Durum + Ziraat Bankası Tablosu

Doğrulama: `tsc -b` 0 hata · `npx vitest run` 235/235 test yeşil ·
`npm run build` başarılı · Ziraat exporter'ın ürettiği gerçek .xlsx
dosyaları LibreOffice `recalc.py` ile yeniden hesaplatıldı (0 formül
hatası) ve hem hücre hücre (openpyxl) hem gözle (JPEG render) kontrol
edildi.

## 1. Mevcut Durum Değeri Hesapla (opsiyonel)

Maliyet Yaklaşımı'nda Şerefiye/Düzeltme kartının altına yeni bir
opsiyonel anahtar eklendi: **"Mevcut Durum Değeri Hesapla"**.

- **Kapalıysa** (varsayılan): hiçbir şey değişmez, eskisi gibi
  çalışır. Yasal ve Mevcut Durum her yerde birebir aynıdır.
- **Açılırsa**: o ana kadar girilmiş yapı satırları aynen aşağıya
  kopyalanır; burada bağımsız olarak değiştirilebilir, silinebilir,
  yeni satır eklenebilir (kaçak yapı, iskânsız ek bölüm gibi
  senaryolar için). Şerefiye/Düzeltme için de ayrı, opsiyonel bir
  tutar girilebilir — boş bırakılırsa Yasal Durum'unki kullanılır.

Bu ayrım artık **PDF Raporu, Excel Raporu, Özet JPEG ve sonuç
ekranındaki KPI kartlarının hepsine** yansıyor: Mevcut Durum
girilmişse iki ayrı bölüm ve iki ayrı nihai değer (Yasal / Mevcut)
gösteriliyor; girilmemişse raporlar eskisi gibi tek bölüm.

Excel round-trip (dışa aktar → içe aktar) bu yeni alanları da taşıyor;
bu özellikten ÖNCE dışa aktarılmış eski bir Excel dosyası da sorunsuz
yükleniyor (bkz. madde 3).

## 2. Yeni: "🏦 Ziraat Tablosu İndir"

Sonuç ekranında PDF/Excel/Özet JPEG'in yanına eklendi. Erhan
Öntürk'ün ilettiği gerçek Ziraat Bankası "Değerleme Detay Tablosu"
şablonu (`NİTELİKLİ GAYRİMENKUL` sayfası) birebir kullanılıyor:

- Yazı tipi, satır aralığı, kırmızı bant, hücre birleşimleri —
  hepsi orijinal şablondan, hiç yeniden çizilmedi.
- **Gerçek Excel formülleri** korunuyor (`=E*F`, `=E*F*G`,
  `=SUM(...)`) — banka dosyayı açtığında bir hücreyi değiştirirse
  tablo kendi kendine yeniden hesaplanır.
- TARLA / ARSA / KONUT-İŞYERLERİ sayfalarına **hiç dokunulmuyor**
  (kapsam dışı, Erhan'ın kararı) — orijinal hâliyle dosyada kalıyorlar.
- **Dora logosu yok** (bilinçli — banka şablonu olarak kalması için).
- Arsa Alanı/Birim Değeri Maliyet Yaklaşımı'ndan geliyor; her yapı
  satırı kendi adı, alanı, birim maliyeti ve amortisman değeriyle
  (dönüştürmeden, doğrudan ÷100) tabloya yazılıyor.
- Gayrimenkul Sıra No (ada/parsel) sütunu boş bırakılıyor, Satış
  Kabiliyeti sabit "SATILABİLİR", 5.000'e yuvarlama bu export'ta
  **uygulanmıyor** — hepsi netleştirdiğimiz karara göre.
- Yasal Durum tablosu her zaman dolduruluyor; Mevcut Durum tablosu,
  yukarıdaki opsiyon açılmışsa kendi verileriyle, kapalıysa Yasal
  Durum'un birebir kopyasıyla doluyor.
- Birden fazla yapı girilirse şablona satır ekleniyor (stil dahil
  kopyalanıyor); Mevcut Durum bloğu da otomatik olarak doğru satıra
  kayıyor.

### Bu turda yakalanan iki gerçek hata (kod incelemesiyle değil, gerçek dosya üretip yeniden hesaplatarak bulundu)

1. Satır eklenince Mevcut Durum'un Arsa satırı formülü eski satır
   numarasına bakmaya devam edip 0 dönüyordu — formül artık her
   zaman güncel satır numarasıyla yeniden yazılıyor.
2. Şablonun kendi örnek verisi (sahte ruhsat metni, "102/6" örnek
   ada/parsel) temizlenmeden kalıyordu — artık her satırda açıkça
   temizleniyor.

## 3. Ayrıca düzeltildi: eski Excel dosyaları artık çökmeden yükleniyor

Bu özellikten önce dışa aktarılmış bir Excel dosyasını "📂 Excel
Yükle" ile geri yüklerken, yeni alanlar (Mevcut Durum ile ilgili)
dosyada bulunmadığı için uygulama hata verirdi. İçe aktarma artık
`createDefaultCostInput()` ile birleştiriliyor — hem eski hem yeni
formatlı dosyalar sorunsuz açılıyor. Gerçek testle doğrulandı
(`src/cost/roundtrip.test.ts`).

## Değişen/Eklenen Dosyalar

```
src/cost/engine.ts          Yasal/Mevcut Durum motoru (computeMevcutDurum, mevcutBuildings, current sonucu)
src/cost/engine.test.ts     +6 yeni test (10/10)
src/cost/pdf.ts             Mevcut Durum bölümleri PDF'e eklendi
src/cost/excel.ts           Mevcut Durum bölümleri Excel raporuna eklendi
src/cost/CostApproachApp.tsx  "Mevcut Durum Değeri Hesapla" anahtarı + ikinci düzenlenebilir blok + Ziraat butonu + içe aktarma düzeltmesi
src/cost/ziraatTemplate.ts  Ziraat şablonunun base64 hâli (gömülü, orijinal dosya, Dora logosuz)
src/cost/ziraatExcel.ts     YENİ — Ziraat Tablosu exporter
src/cost/ziraatExcel.test.ts  YENİ — 4 test (tek yapı, çoklu yapı, Mevcut Durum kayması, farklı satır senaryosu)
src/cost/roundtrip.test.ts  YENİ — 2 test (yeni format round-trip, eski format geriye uyumluluk)
package.json, src/brand/brand.ts  v9.2.0
```

## Yükleme

`src` / `public` / `package.json` klasör ve dosyalarını GitHub'a
sürükle → **önce kök dosyalar, sonra ayrı ayrı `src`, sonra ayrı
ayrı `public`** (karıştırma) → Commit directly to main → Actions
sekmesinde yeşile dönene kadar bekle → Ctrl+F5.

## Kapsam dışı bırakılanlar (bilinçli, konuşarak netleştirildi)

- Halkbank ve TARLA/ARSA/KONUT-İŞYERLERİ sayfaları için ayrı bir
  eşleme çalışması yapılmadı — yalnız Ziraat + NİTELİKLİ GAYRİMENKUL.
- Ziraat export'unda 5.000'e yuvarlama yok (kullanıcı elle
  dengeleyecek).
