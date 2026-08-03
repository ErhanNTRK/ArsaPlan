# ArsaPlan v6.0.17 — Döviz + İngilizce Uyarısı + Responsive Düzeltmeleri (Birleşik Paket)

Doğrulama: tsc 0 hata, test 192/192, build başarılı. v6.0.15+v6.0.16'da
anlattığım her şey + bu turun responsive düzeltmeleri, tek pakette.

## Bu pakette olanlar (önceki iki zip'in bilgisiyle birleşik)

1. **Otel'de döviz tam yayılım** — ekran, PDF, motor özet metni dahil
   her yerde seçilen para birimi (TL/USD/EUR) kullanılıyor.
2. **İngilizce çevirisindeki kritik hata düzeltildi** — kod var olmayan
   bir element ID'sini (`arsaplan-root`) arıyordu, gerçek ID `root`;
   bu yüzden otomatik ekran çevirisi hiç tetiklenmiyordu.
3. **Dil düğmesi artık her ekranda** (🌙/☀️ tema düğmesi gibi, sağ altta
   sabit) — önceden yalnız Arsa modülünde vardı.
4. **Kısmi İngilizce uyarısı eklendi**: İngilizce moda geçildiğinde
   altta "This version does not yet fully support English — some
   sections remain in Turkish." bandı görünüyor. Çevirisi olan yerler
   İngilizce, olmayanlar Türkçe kalıyor.
5. **Responsive: uygulama genelinde kullanılan üç ızgara sınıfının
   (`.grid-2`, `.grid-3`, `.mini-kpi`, `.kpi-grid`) telefon ekranında
   HİÇ tek kolona düşmediği bulundu ve düzeltildi.** Bu sınıflar
   Arsa/Otel/Tarım gibi birçok modülde çok kullanıldığı için, düzeltme
   uygulama genelinde etkili.

## Dürüst sınır

- Bu responsive turu **kod incelemesiyle bulunan gerçek hataları**
  kapsıyor (canlı tarayıcı testi yapamadığım için görsel doğrulama
  yok) — daha küçük, gözden kaçan sorunlar kalmış olabilir.
- **Excel içe aktarma bu pakete YİNE alınmadı.** 7 farklı modülün
  kendi Excel yapısını geri okuyup formu doldurması, düzgün yapılırsa
  gerçekten uzun ve dikkatli test isteyen bir iş — aceleye getirip
  yarım/hatalı bir özellik teslim etmek istemedim. Bu, kendi başına
  ayrı bir tur olarak kalıyor; hazır olduğunda haber ver.

## Yükleme
1. Zip'i çıkar (`src`, `public`, `package.json`, bu dosya görünecek).
2. github.com/ErhanNTRK/ArsaPlan → **Add file → Upload files**.
3. `src` klasörünün **simgesini** (içine girmeden) sürükle-bırak, aynısını
   `public` klasörü ve `package.json` dosyası için de yap.
4. "Üzerine yazılsın mı?" → **evet**.
5. **Commit changes**.
6. **Actions** sekmesinde yeşil tik belirene kadar bekle (~30-60 sn).
7. Siteyi **Ctrl+F5** ile tazele.
