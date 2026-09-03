# ArsaPlan v9.17.0 — Üst Hakkı 4. Yöntem, Akaryakıt Gelir Kalemleri Düzeltmesi, Font Hatası Zinciri

Doğrulama: `tsc -b` 0 hata · `npx vitest run` **441/441 test yeşil** ·
`npm run build` başarılı.

## 1. Üst Hakkı — YENİ dördüncü yöntem: "Basit Gelir Bazlı Üst Hakkı Hesabı"

"Toplam Gelir Üzerinden Üst Hakkı Hesabı" (Ayrıntılı) modelinin
sadeleştirilmiş kardeşi — Salih'in testinde (%3,7 fark) doğrulanan
mimari artık gerçek bir özellik. Seçim ekranına dördüncü kart olarak
eklendi.

**39 alan yerine ~13 alan:**
- 5 gelir kalemi yerine TEK "Toplam Gelir" tabanı
- 6 işletme gideri oranı yerine TEK oran
- 4 sabit gider oranı yerine TEK oran
- Ecrimisil/Üst Hakkı Ödemesi/Bayilik AYNEN korunuyor
- Kalan Süre = Projeksiyon Süresi, terminal değer yok (Ayrıntılı ile aynı doğru ilke)
- Maliyet Yaklaşımı yok (yalnızca gelir akışı üzerinden)

PDF/Excel: sonuç en başta, "Girdi Varsayımları" bölümü, dönemsel özet
tablosu — diğer üç Üst Hakkı modeliyle aynı tasarım dili. Banka
İsmi/Şube İsmi/Tarih şeridi de dahil.

Yeni dosyalar: `gelirBazliEngine.ts`, `gelirBazliPdf.ts`,
`gelirBazliExcel.ts`, `GelirBazliUstHakkiApp.tsx` — 11 yeni test.

## 2. Akaryakıt — "Market Geliri gider gibi görünüyor" hatası düzeltildi

"DİĞER GELİRLER VE KESİNTİLER" tek başlığı, gelir kalemlerini (Market,
Oto Yıkama vb.) bir kesintiyle (Dağıtıcı Kirası) karıştırıyordu. Artık
**"DİĞER GELİR KALEMLERİ"**, **"KESİNTİLER"**, **"SONUÇ"** olarak üç
ayrı, net başlık — hem PDF'te hem Excel'de. "Ciro × kâr%" modundaki
kalemlerin hesap detayı da artık gösteriliyor.

Ayrıca önceki turda düzeltilmiş olan "her kalem kendi ismiyle" davranışı
(Market Geliri, Oto Yıkama, Restoran Geliri gibi — yalnız Market değil,
TÜMÜ) bu zip ile ilk kez teslim ediliyor.

## 3. Font karakteri hatası zinciri — altı dosyada düzeltildi

Özel fontumuzda (NTRK) "×", "÷", "â" karakterlerinin bazı bağlamlarda
metni **sessizce kestiği** keşfedildi — bu, önceki turda (v9.16.0)
eklenen Otel İNA detay tablosunun "Terminal Değer Formülü" satırını da
etkiliyordu (yalnız başlık görünüyordu, gerçek formül/rakamlar
görünmüyordu). Düzeltilen dosyalar: `usthakki/simplePdf.ts`,
`fuel/pdf.ts`, `fuel/excel.ts`, `hotel/pdf.ts`, `export/pdf.ts` (üç eski
kullanım).

## Hesaplamalarda değişiklik oldu mu?

**Hayır**, iki kalem de (2, 3) yalnızca gösterim düzeltmesi. Kalem 1 ise
tamamen yeni bir hesaplama seçeneği — mevcut hiçbir hesaba dokunmuyor.

## Değişen/Eklenen Dosyalar

```
src/usthakki/gelirBazliEngine.ts       YENİ — Yöntem 4 motoru
src/usthakki/gelirBazliPdf.ts          YENİ — Yöntem 4 PDF
src/usthakki/gelirBazliExcel.ts        YENİ — Yöntem 4 Excel
src/usthakki/GelirBazliUstHakkiApp.tsx YENİ — Yöntem 4 UI
src/usthakki/gelirBazliYontem4.test.ts YENİ — 11 test
src/App.tsx                            Yöntem 4 yönlendirmesi + seçim ekranı kartı

src/fuel/pdf.ts, excel.ts              Gelir/Kesinti bölüm ayrımı + font düzeltmesi
src/fuel/kalem-market-geliri-ismi.test.ts   7 test (genişletildi)

src/hotel/pdf.ts                       Terminal Değer Formülü font düzeltmesi
src/hotel/bu-oturum-yedi-kalem.test.ts Güçlendirilmiş test (formülün TAMAMI kontrol ediliyor)

src/export/pdf.ts                      Üç eski × kullanımı düzeltildi
src/usthakki/simplePdf.ts              × / ÷ font düzeltmesi
```

## Kapanan konular

- ~~KML uydu görüntüsü~~ — kullanıcı istemedi, kapatıldı.
- ~~İndirgenmiş Kat Karşılığı Yöntemi~~ — vazgeçildi.
