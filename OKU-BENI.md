# ArsaPlan v7.1.0 — Tüm Bekleyen Maddeler Tamamlandı

Doğrulama: tsc 0 hata, test 192/192, build başarılı. Kritik iki madde
(PDF başlık tekrarı, Maliyet-boşsa-gizle) gerçek PDF üretilerek ayrıca
doğrulandı.

## Bu pakette tamamlanan 7 madde (dünkü "yarına kalanlar" listesi)

1. **Akaryakıt İlave Gelir Getiriciler artık gerçek dropdown.**
   Önceden gizli bir "datalist" idi, kullanıcı fark etmiyordu. Şimdi
   tıklayınca tüm seçenekler (Market, Restoran/Kafe, Oto Yıkama, **Araç
   Temizlik Merkezi** (yeni), LPG, Elektrikli Şarj, ATM/Banka, Reklam,
   Araç Bakım/Lastik Servisi, **Lastik Satış ve Değişimi** (yeni),
   Tekel, Kira) hemen görünüyor, en altta "Diğer (elle yaz)" var.
2. **Akaryakıt: Maliyet Yaklaşımı verisi boşsa artık PDF/Excel'de hiç
   görünmüyor.** Kök neden: "Maliyet Yaklaşımı" açıksa (checkbox
   işaretliyse) ama içi boşsa motor sessizce 0 TL hesaplıyordu, "Maliyet
   Yöntemi 0 TL" gibi hoş olmayan bir satır çıkıyordu. Artık yalnız
   gerçekten veri girilmişse (arsa veya yapı değerinden biri sıfırdan
   büyükse) hesaplanıyor, aksi hâlde raporlarda tamamen gizli kalıyor.
3. **Kapitalizasyon Oranı artık Akaryakıt PDF ve Excel'de ayrı,
   belirgin bir satır** (önceden yalnız formül cümlesinin içinde
   gömülüydü).
4. **Üst Hakkı — Toplam Gelir Üzerinden PDF'inde başlık tekrarı
   düzeltildi.** Kök neden: sayfa değişimini kontrol eden mantık
   yanlıştı, yeni sayfanın ilk 4-5 satırının hepsinde başlık tekrar
   basılıyordu. Artık yalnız gerçek sayfa geçişinde, tam bir kez
   basılıyor — 42 yıllık bir raporla test edilip doğrulandı.
5. **Arsa Gelir Projeksiyonu PDF'inden KAKS/TAKS uyarıları
   kaldırıldı** (hem "eksik kullanım" hem "aşım" uyarısı) — resmi
   rapor artık bu tür teknik uyarılar içermiyor, uyarılar yalnızca
   uygulama ekranında kalmaya devam ediyor.
6. **Kat Tablosu artık duyarlı, çok sütunlu bir ızgara.** Çok katlı
   binalarda (örn. 13 kat) kartlar artık ekran genişliğine göre otomatik
   2-4 sütuna yayılıyor, tek sütunda alt alta uzayıp sağ tarafın boş
   kalması sorunu çözüldü. TOPLAM satırı hep tam genişlikte kalıyor.
7. **TAKS'sız projelerde artık iki yönlü destek var:** TAKS kutusunda,
   KAKS ve Hmax doluysa, KAKS'ın tahmini kat sayısına bölünmesiyle
   bulunan bir **sayısal öneri placeholder olarak** görünüyor (metin
   açıklaması yok, yalnız gri bir sayı — kullanıcı yazmaya başlarsa
   kaybolur). Ayrıca ayrı bir ipucu, kat alanları zaten biliniyorsa
   **Doğrudan Alan Girişi** moduna yönlendiriyor.

## Şu anda bilinen açık bir madde yok

Bu, üzerinde konuştuğumuz tüm maddelerin tamamlandığı bir kapanış
paketi. Uygulamayı dener, yeni bir şey bulursan her zamanki gibi
bildir.

## Yükleme
1. Zip'i çıkar (`src`, `public`, `package.json`, bu dosya görünecek).
2. github.com/ErhanNTRK/ArsaPlan → **Add file → Upload files**.
3. `src` klasörünün **simgesini** (içine girmeden) sürükle-bırak, aynısını
   `public` klasörü ve `package.json` dosyası için de yap.
4. "Üzerine yazılsın mı?" → **evet**.
5. **Commit changes**.
6. **Actions** sekmesinde yeşil tik belirene kadar bekle (~30-60 sn).
7. Siteyi **Ctrl+F5** ile tazele.

İyi çalışmalar! 📝
