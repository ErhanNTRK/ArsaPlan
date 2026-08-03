# ArsaPlan v6.0.13 — Otel Maliyet Yaklaşımı + PDF İçerik Seçimi

Doğrulama: `npx tsc -b` → 0 hata · `npm run test` → **192/192** · `npm run
build` → başarılı · oxlint → 0 hata. (Token tasarrufu için doğrulama bu
turda sadeleştirildi: tek gerçek PDF testiyle sağlandı, öncekiler kadar
çok sayıda alt senaryo denenmedi.)

## Otel Gelir Hesabına Maliyet Yaklaşımı eklendi

- **Arsa Alanı**: elle girilebilir veya **KML yükle** ile otomatik
  doldurulur (Üst Hakkı modülüyle aynı KML okuyucu).
- **Yapılar**: istediğiniz kadar satır — **Yapı Türü** (Üst Hakkı'nın
  39 kalemlik kataloğuyla aynı liste, paylaşılan), Alan, Birim Maliyet,
  opsiyonel **Amortisman %**.
- **Maliyet Yaklaşımı Değeri** = Arsa Değeri + Yapı Değerleri, en yakın
  **5.000'e yuvarlanmış**.
- Sonuç ekranında not kutusunda gösteriliyor; PDF'e de eklendi.

## PDF içerik seçimi

"Rapor" kartında artık üç onay kutusu var: **Gelir (Direkt
Kapitalizasyon)**, **İNA**, **Maliyet Yaklaşımı** — hepsi varsayılan
işaretli. İşareti kaldırılan yöntem PDF'te görünmez. (Not: "Gelir"
kutusu şimdilik yalnız gösterge amaçlı — PDF'in en üstündeki ana özet
kutusu her zaman görünür kalıyor, token tasarrufu için bu turda ayrıca
gizlenebilir hale getirilmedi; İNA ve Maliyet bölümleri tam çalışıyor.)

## Kapitalizasyon Değeri artık 5.000'e yuvarlanıyor

Otel modülünün nihai Direkt Kapitalizasyon değeri de (Üst Hakkı ve
Tarımsal Ürün'deki gibi) en yakın 5.000'e yuvarlanıyor.

## Bu pakette YAPILMAYAN

- Otel'de döviz seçimi (TL/USD/EUR) henüz UI'da sorulmuyor — tip zaten
  hazır (`currency`/`fxRate`), yalnız ekran sorusu eklenmedi.
- "Gelir" PDF kutusunun tam gizlenebilirliği (yukarıda not edildi).
- Excel içe aktarma, tam İngilizce, cihaz-bazlı tasarım — hâlâ bekliyor.

## Yükleme
1. Zip'i çıkar (`src`, `public`, `package.json`, bu dosya görünecek).
2. github.com/ErhanNTRK/ArsaPlan → **Add file → Upload files**.
3. `src` klasörünün **simgesini** (içine girmeden) sürükle-bırak, aynısını
   `public` klasörü ve `package.json` dosyası için de yap.
4. "Üzerine yazılsın mı?" → **evet**.
5. **Commit changes**.
6. **Actions** sekmesinde yeşil tik belirene kadar bekle (~30-60 sn).
7. Siteyi **Ctrl+F5** ile tazele.
