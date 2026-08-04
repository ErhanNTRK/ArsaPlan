# ArsaPlan v7.0.3 — Birikmiş Düzeltmeler (Kapsamlı Tur)

Doğrulama: tsc 0 hata, test 192/192, build başarılı. Her madde gerçek
PDF/Excel üretilerek ayrı ayrı doğrulandı.

## Bu pakette TAMAMLANAN maddeler

1. **Checkbox'lar artık gerçekten çalışıyor** — uygulama genelini
   etkileyen bir CSS kök hatası (input,select,textarea kuralı
   checkbox'ları da eziyordu) düzeltildi.
2. **"En yakın 5.000'e yuvarlanmış" ifadesi 6 yerden kaldırıldı**
   (Tarımsal, Üst Hakkı, Otel — uygulama+PDF+Excel).
3. **Gelirler Tablosu oranları artık her alanın yanında belirgin
   rozet** olarak görünüyor (Üst Hakkı — Toplam Gelir Üzerinden).
4. **İşletme Giderleri yüzdelerinin yanında döviz karşılığı** rozeti.
5. **Otel'de İNA bölümü artık ayrı, "OPSİYONEL" rozetli kendi kartında.**
6. **Tarımsal Ürün: Yan ürün artık ana ürün gibi tam detaylı**
   (Birim, Verim, Fiyat, Gider% — önceden yalnız isim+net görünüyordu).
7. **"Değer = yıllık net gelir" ibaresi 4 yerden tamamen kaldırıldı.**
8. **Üst Hakkı'nda "Otel Binası" ve "Apart Otel Binası" bina türleri
   eklendi** (listenin başına) — üç yöntemde ve Otel'de.
9. **"Diğer" seçilince artık elle yazma kutusu açılıyor** — üç yerde.
10. **Excel logo/başlık çakışması düzeltildi** (Yöntem 1/2 — Toplam
    Değerden / Sadece Arsa Değeri Üzerinden).
11. **Toplam Değerden Üst Hakkı Hesabı'nda "Daimi Müstakil Hak Değeri"
    satırı kaldırılıp "Taşınmazın Değeri" ile değiştirildi.**
12. **Nihai değer artık her üç Üst Hakkı yönteminde de hem seçilen
    dövizde hem TL karşılığında** gösteriliyor (ekran+PDF+Excel).
13. **Üst Hakkı Excel'inin Dönemsel Tablosu geniş matrise dönüştürüldü**
    (kategori-satır/dönem-sütun, referans banka şablonu formatında,
    "Toplam Gelir İçerisinde Oranı" sütunu dahil).
14. **Otel Gelir Hesabı'na Maliyet Yaklaşımı, Nihai Değer Seçimi'ne
    eklendi** (Direkt Kapitalizasyon / İNA / Maliyet Yaklaşımı / Elle
    Tutar).
15. **Otel PDF'i artık seçilen nihai yönteme göre dinamik:** seçilen
    yöntem en üstte belirgin, işaretli diğer yöntemler altında,
    birden fazla yöntem gösteriliyorsa en altta karşılaştırma özeti.
16. **Otel'de döviz tam yayılımı** (ekran+PDF+motor özet metni).
17. **İngilizce çevirisindeki kritik ID hatası düzeltildi**, global
    dil düğmesi + kısmi İngilizce uyarı bandı eklendi.
18. **Excel içe aktarma** — 5 modülde (Tarımsal, Akaryakıt, Üst
    Hakkı'nın üç yöntemi) çalışıyor.
19. **Uygulama genelinde 4 ızgara sınıfının** (grid-2/3, mini-kpi,
    kpi-grid) telefon ekranında tek kolona düşmemesi düzeltildi.
20. **Otel'de KAKS/TAKS havuzu aşım uyarısı** (ekran+PDF).
21. **Her tek-ekran modülde sabit alt "← Ana Sayfaya Dön" bar'ı.**

## YARIN ele alınacaklar (bu pakete YOK, aceleye getirilmedi)

- **Akaryakıt İlave Gelir Getiriciler'i gerçek dropdown'a çevirmek** +
  "Araç Temizlik Merkezi"/"Lastik Satış ve Değişimi" eklemek.
- **Akaryakıt: Maliyet Yaklaşımı verisi boşsa PDF/Excel'de hiç
  gösterilmemesi** (kök neden bulundu, kodlanmadı).
- **Akaryakıt: Kapitalizasyon Oranının PDF/Excel'de ayrı, belirgin bir
  satır olarak da gösterilmesi.**
- **Ayrıntılı Üst Hakkı PDF'inde dönem başlığının yeni sayfada birkaç
  kez tekrar basılması** (kök neden bulundu — `if (y<48)` mantık hatası
  — kodlanmadı).
- **Arsa modülünde KAKS/TAKS havuzu aşım uyarısının PDF'ten
  kaldırılması** (ekranda kalsın, PDF'te görünmesin — kodlanmadı).
- **Kat Tablosu'nun (çok katlı binalarda) duyarlı çok sütunlu ızgaraya
  çevrilmesi** (tek sütunda alt alta uzayıp sağ tarafın boş kalması).
- **TAKS'sız projelerde KAKS/Kat Sayısı öneri değeri + "Doğrudan Alan
  Girişi" yönlendirme ipucu.**

## Yükleme
1. Zip'i çıkar (`src`, `public`, `package.json`, bu dosya görünecek).
2. github.com/ErhanNTRK/ArsaPlan → **Add file → Upload files**.
3. `src` klasörünün **simgesini** (içine girmeden) sürükle-bırak, aynısını
   `public` klasörü ve `package.json` dosyası için de yap.
4. "Üzerine yazılsın mı?" → **evet**.
5. **Commit changes**.
6. **Actions** sekmesinde yeşil tik belirene kadar bekle (~30-60 sn).
7. Siteyi **Ctrl+F5** ile tazele.

İyi çalışmalar — yarın kalanlarla devam ederiz! 📝
