# ArsaPlan v6.0.15 — Döviz Tam Yayılım + Global İngilizce Düğmesi

Doğrulama: tsc 0 hata, test 192/192, build başarılı, derlenmiş çıktıda
kritik iki düzeltme doğrulandı.

## 1) Otel'de döviz artık gerçekten her yere yayılıyor

React Context tabanlı bir çözümle (her fonksiyona tek tek prop
geçirmeden): ekrandaki tüm tutarlar, PDF'teki tüm tutarlar, hatta
motorun ürettiği "Değerlendirme Özeti" cümlesindeki gömülü ₺ işaretleri
bile artık seçilen para birimine (TL/USD/EUR) göre değişiyor. Gerçek
bir EUR PDF üretilip **sıfır ₺ kaldığı** doğrulandı.

## 2) İngilizce çevirisinde gerçek bir hata bulundu ve düzeltildi

**Kök neden:** Ekran çevirisini tetikleyen kod `document.getElementById
('arsaplan-root')` arıyordu ama uygulamanın gerçek kök elemanı
`id="root"` — bu isim uyuşmazlığı yüzünden **otomatik DOM çevirisi hiç
tetiklenmiyordu**, muhtemelen bu yüzden "İngilizce sadece bazı
bölümlerde çalışıyor" izlenimi oluşmuştu. Düzeltildi.

**Ayrıca:** Dil değiştirme düğmesi önceden yalnızca Arsa modülünün üst
barındaydı. Artık (tema düğmesi 🌙/☀️ gibi) **her ekranda sağ altta
sabit bir "🌐 EN/TR" düğmesi** var — Tarım, Akaryakıt, Otel, Üst
Hakkı'nın üç yönteminde de çalışıyor.

**Sözlük genişletildi:** Bu dört modül ailesinin en görünür kart
başlıkları ve ana etiketleri (35+ terim) çeviri sözlüğüne eklendi.

## Dürüst sınır — bu pakette YAPILMAYAN (ayrı, dikkatli test gerektiren ikinci zip'e bırakıldı)

- **PDF/Excel metinlerinin çevirisi** — ekran çevirisi otomatik DOM
  taramasıyla çalışıyor ama PDF/Excel üretimi DOM'a dokunmuyor, her
  metnin elle `t()` ile sarmalanması gerekiyor (10 dosya, yüzlerce
  metin). Canlı test edemeden aceleye getirmek istemedim.
- **İnce ipucu/tooltip metinlerinin tam çevirisi** (yalnız en görünür
  ~35 kart başlığı/etiket eklendi, yüzlerce küçük ipucu metni kaldı).
- **Excel içe aktarma** — büyük, riskli, kendi başına bir iş.
- **Cihaz-bazlı (PC/tablet/telefon) tasarım** — canlı tarayıcı testi
  yapamadığım için yalnızca kod incelemesiyle bulduğum gerçek hatalar
  düzeltilebiliyor, kapsamlı bir tur gerektiriyor.

Bu üçü için ayrı bir zip hazırlıyorum.

## Yükleme
1. Zip'i çıkar (`src`, `public`, `package.json`, bu dosya görünecek).
2. github.com/ErhanNTRK/ArsaPlan → **Add file → Upload files**.
3. `src` klasörünün **simgesini** (içine girmeden) sürükle-bırak, aynısını
   `public` klasörü ve `package.json` dosyası için de yap.
4. "Üzerine yazılsın mı?" → **evet**.
5. **Commit changes**.
6. **Actions** sekmesinde yeşil tik belirene kadar bekle (~30-60 sn).
7. Siteyi **Ctrl+F5** ile tazele.
