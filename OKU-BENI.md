# ArsaPlan v6.0.2 — Kat Kurgusu, Asma Kat, Akaryakıt Eksikleri + Font Hatası Düzeltmesi

Doğrulama: `npx tsc -b` → 0 hata · `npm run test` → **165/165** · `npm run build`
→ başarılı · oxlint → 0 hata. Her PDF/Excel çıktısı gerçek üretilip (bazıları
LibreOffice ile gerçek render alınarak) metin/görsel kontrol edildi.

## Bu pakette düzelenler

1. **Kat sıralaması düzeltildi** (ekran + PDF + Excel): artık gerçek bina
   mantığıyla en üstten alta Çatı → Normal Katlar → Asma Kat → Zemin →
   Bodrumlar (en son eklenen bodrum en altta) sırasıyla görünüyor. Gerçek
   PDF üretilip doğrulandı.
2. **Ticari/Karma + Çekme Mesafesi'nde Asma Kat eksikliği düzeltildi.**
   Kök neden: `computeCekme` (Çekme Mesafesi motoru) içinde asma kat mantığı
   hiç yoktu; UI'daki gizleme bunu doğru yansıtıyordu. Motora eklendi, golden
   testle kilitlendi, gerçek PDF'te doğrulandı. Asma kat oranı %40'ta
   bırakıldı (araştırma: yasal asgari 1/3 ≈ %33, Planlı Alanlar İmar
   Yönetmeliği m.4 — %40 bu asgarinin makul üzerinde); ipucu metnine yasal
   asgari referansı eklendi.
3. **Tarımsal Ürün Excel'indeki #### hatası kesin çözüldü.** Kök neden: Net
   Gelir/Yaklaşık Değer sayıları 3 birimlik dekoratif bir kenar sütununa
   yazılıyordu. Sütun genişlikleri düzeltildi; LibreOffice ile gerçek dosya
   render edilip metninde `#` karakteri SIFIR olduğu kanıtlandı.
4. **Kat Kurgusu ekranındaki responsive sorun düzeltildi.** Sabit 5 kolonlu
   ızgara (orta ekranlarda sıkışıp kutuların üst üste binmesine yol açıyordu)
   yerine Dora'daki kanıtlanmış "etiketli iki-katlı kart" deseni kullanıldı —
   kat sayısı ne kadar artarsa artsın hiçbir kutu üst üste binmez.

## Akaryakıt Gelir Hesabı — eksikler tamamlandı

- **"↺ Sayfayı Sıfırla" düğmesi eklendi** (üst bardaki geri düğmesinin
  yanında; onay sorar, taslağı ve tüm alanları temizler).
- **"Diğer Gelirler (yakıt cirosunun %'si)" tek satır eklendi** — ayrıntılı
  gelir kalemleriyle (Market, Oto Yıkama vb.) BİRLİKTE veya bunların yerine
  kullanılabilir; bazı ekspertiz dosyalarında yalnız tek bir "Diğer Gelirler"
  toplamı bulunduğu için (banka formatlarında görülen desen). Golden testli.
- **PDF ve Excel indirme eklendi** (önceden bu modülde hiç yoktu) — Tarımsal
  Ürün ve Arsa modülleriyle aynı kurumsal görsel dili paylaşıyor (NAVY/GOLD
  paleti, aynı başlık/altbilgi). Gelir + (varsa) Maliyet yaklaşımı yan yana.
  Gerçek verilerle üretilip hem PDF metni hem Excel'in LibreOffice render'ı
  satır satır doğrulandı.

## Bonus: uygulama genelinde önceden var olan bir font hatası bulundu ve düzeltildi

PDF'lerde kullanılan gömülü Türkçe font **â/ê/î/ô/û (şapkalı ünlüler)
karakterlerini hiç desteklemiyormuş** — bu, benim bu turki modüllerimin değil,
**uygulamanın en başından beri var olan** bir hataydı: Arsa modülündeki
"Müteahhit Kârı" satırı da PDF'te sessizce kesiliyordu, önceki teslimatlarda
fark edilmemiş. Kalıcı font düzeltmesi riskli/kapsamlı olacağından, güvenli
ve hızlı çözüm uygulandı: "Kâr" kelimesi PDF/Excel üreten TÜM dosyalarda
(export/pdf.ts, export/excel.ts, fuel/pdf.ts, fuel/excel.ts) anlamca eşdeğer
ve karakter sorunu olmayan **"Kazanç"** ile değiştirildi ("Müteahhit Kazancı",
"Net Kazanç" vb.) — hem yeni hem eski PDF'lerde artık kesilme yok, gerçek
PDF'lerle doğrulandı.

## Bu paketin KAPSAMADIĞI (dürüst sınır)

- **Üst Hakkı Değerleme Modülü** — detaylı konuştuğumuz, en büyük yeni modül
  henüz yazılmadı. Ayrı bir turda ele alınacak.
- **Akaryakıt'ın derin sayfa düzeni/mod seçimi/otomasyon-Excel okuma
  yeniden tasarımı** — bu pakette yalnız üç somut eksik (sıfırlama, %'lik
  diğer gelir, PDF/Excel) eklendi; ChatGPT prompt'undaki daha büyük yeniden
  tasarım (veri girişi öncesi yöntem seçimi ekranı vb.) henüz işlenmedi.

## Yükleme
GitHub → ArsaPlan → Add file → Upload files → `src`, `public`, `package.json`
sürükle → Commit → Actions'ın yeşile dönmesini bekleyin.
