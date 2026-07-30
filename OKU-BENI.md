# ArsaPlan v6.0.3 — Üst Hakkı Değerleme Modülü (YENİ) + Akaryakıt Ekleri

Doğrulama: `npx tsc -b` → 0 hata · `npm run test` → **190/190** · `npm run build`
→ başarılı · oxlint → 0 hata. Üst Hakkı için gerçek 31 dönemlik PDF (2 sayfa,
otomatik sayfalama) ve Excel gerçek üretilip LibreOffice ile render alınarak
doğrulandı.

## YENİ: Üst Hakkı Değerleme Modülü

Yalnız oteller değil, üst hakkına konu olabilecek tüm gelir getirici
taşınmazlar için. Landing ekranındaki "Hazırlanıyor" rozeti kalktı, modül
aktif.

- **Ana yöntem: Gelir İndirgeme (DCF).** Dönem sayısı SABİT DEĞİL — tamamen
  kalan üst hakkı süresine göre otomatik oluşur (golden testle 10/22/31/47/49
  yıl senaryoları doğrulandı).
- **Az veri ilkesi:** yıl yıl elle doldurma yok — 1. yıl geliri + yıllık
  büyüme oranı girilir, tablo kendisi türetilir (Otel modülüyle aynı dil;
  Denizbank'ın gerçek şablonundaki büyüme-oranı deseniyle doğrulandı).
- **Süre:** tesis tarihi + ilk süre girilirse kalan süre otomatik önerilir
  (öneri asla dayatılmaz, elle değiştirilebilir).
- **Üst hakkı/irtifak ödemesi ve Ecrimisil** — ikisi de ayrı, opsiyonel,
  kendi büyüme oranlı satırlar (Denizbank örneğinden öğrenilen: ecrimisil de
  gerçekten yıllık tekrarlanan bir DCF kalemi olarak modellenmiş).
- **Terminal değer varsayılan YOKTUR** — yalnız sözleşmede devir bedeli
  belirtilmişse açılır ve son yıla indirgenir.
- **İskonto oranı:** risksiz + risk primi (üst hakkı tam mülkiyetten daha
  riskli — süre sonu belirsizliği).
- **Referans Üst Hakkı Hesabı** (pratik çapraz kontrol, ana yöntem değil):
  K = Kalan Süre Anüite Faktörü ÷ İlk Süre Anüite Faktörü, aynı iskonto
  oranıyla.
- **Maliyet ve Emsal yaklaşımları** — opsiyonel, manuel/yapıştırılan referans
  değerler olarak yan yana gösterilir.
- **Nihai değer** — DCF / Referans / Maliyet / Emsal / Elle Gir arasından
  KULLANICI seçer; sistem hiçbir zaman dayatmaz.
- **PDF + Excel** — tam DCF tablosu (dönem sayısı kaç olursa olsun, PDF'te
  otomatik sayfalanır, taşmaz), kurumsal görsel dil (NAVY/GOLD, Dora logosu).
- **25 golden test.**

## Akaryakıt — üç eksik daha tamamlandı

- **"↺ Sayfayı Sıfırla"** düğmesi (bir önceki pakette eklenmişti, bu pakette
  de mevcut).
- **"Diğer Gelirler (yakıt cirosunun %'si)"** tek satır (bir önceki pakette).
- **PDF + Excel indirme** (bir önceki pakette).
- **YENİ — Kapitalizasyon oranı konum önerisi:** önceden yalnızca ipucu
  (tooltip) metni vardı, gerçek bir seçici yoktu. Şimdi "Konum" açılır
  menüsü var: Şehir İçi (%10) / Şehre Yakın Orta Ölçek (%10-12) / Şehirlerarası
  (%12) — seçilince kap. oranı kutusuna otomatik yazılır, sonra elle
  değiştirilebilir.

## Bonus: uygulama genelinde önceden var olan font hatası düzeltildi

PDF'lerde kullanılan gömülü Türkçe font â/ê/î/ô/û karakterlerini hiç
desteklemiyordu (Arsa modülündeki "Müteahhit Kârı" da sessizce kesiliyordu).
"Kâr" kelimesi tüm PDF/Excel üreten dosyalarda "Kazanç" ile değiştirildi;
Üst Hakkı modülü de baştan bu kısıtı bilerek yazıldı (hiç "â" kullanmadı).

## Bu paketin KAPSAMADIĞI (dürüst sınır)

- **Akaryakıt'ın "yöntem seçimi" giriş kapısı** (Tarımsal Ürün'deki gibi
  baştan "hangi veri elinde?" ekranı) — henüz eklenmedi.
- **Akaryakıt otomasyon-Excel okuma** — örnek dosya beklendiği için hiç
  başlanmadı.
- **Genel stil taraması** (Otel/İşletme modüllerinin tekrar gözden
  geçirilmesi) — bu turlarda öncelik Tarım/Akaryakıt/Arsa/Üst Hakkı oldu.

## Yükleme
GitHub → ArsaPlan → Add file → Upload files → `src`, `public`, `package.json`
sürükle → Commit → Actions'ın yeşile dönmesini bekleyin.
