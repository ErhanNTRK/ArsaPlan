# ArsaPlan v6.0.11 — İki Hızlı Hata Düzeltmesi

Doğrulama: `npx tsc -b` → 0 hata · `npm run test` → **192/192** · `npm run
build` → başarılı · oxlint → 0 hata. İkinci düzeltme gerçek PDF üretilerek
(Direkt Kapitalizasyon vs İNA senaryoları ayrı ayrı) doğrulandı.

## 1) "PDF ve Excel'de Göster" anahtarı artık tıklanabiliyor

**Kök neden bulundu:** Toplam Gelir Üzerinden Üst Hakkı Hesabı modülünde,
"Maliyet Yaklaşımı" kartının altındaki açıklama metni (`.hint`)
yanlışlıkla checkbox'ı içeren flex kutusunun **içine** yerleşmişti (bir
kapanış `</div>` yanlış satırdaydı). Uzun açıklama metni, flex düzeninde
checkbox'ın üzerine görsel olarak biniyor, tıklamayı engelliyordu. Kapanış
etiketi doğru yere taşındı — anahtar artık tıklanabiliyor, işaretini
değiştirebiliyorsunuz.

## 2) Otel Gelir Hesabı: İNA seçili değilse PDF'te projeksiyon tablosu artık gösterilmiyor

Daha önce "Yıllık Projeksiyon Tablosu" PDF'te seçilen nihai yöntem ne
olursa olsun (Direkt Kapitalizasyon bile seçilse) her zaman basılıyordu.
Artık yalnızca **İNA** seçiliyken gösteriliyor — çünkü yalnız İNA yöntemi
bu projeksiyonu değere gerçekten yansıtıyor; Direkt Kapitalizasyon
seçiliyken projeksiyonun sonuca hiçbir etkisi yok, göstermek kafa
karıştırıyordu.

Gerçek PDF'lerle doğrulandı: Direkt Kapitalizasyon senaryosunda tablo
**0 kez**, İNA senaryosunda **1 kez** görünüyor; her iki durumda da
sayfa akışı ("Değerlendirme Özeti" bölümü) sorunsuz devam ediyor.

## Yükleme
1. Zip'i çıkar (`src`, `public`, `package.json`, bu dosya görünecek).
2. github.com/ErhanNTRK/ArsaPlan → **Add file → Upload files**.
3. `src` klasörünün **simgesini** (içine girmeden) sürükle-bırak, aynısını
   `public` klasörü ve `package.json` dosyası için de yap.
4. "Üzerine yazılsın mı?" → **evet**.
5. **Commit changes**.
6. **Actions** sekmesinde yeşil tik belirene kadar bekle (~30-60 sn).
7. Siteyi **Ctrl+F5** ile tazele.
