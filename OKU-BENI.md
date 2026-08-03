# ArsaPlan v7.0.2 — Checkbox Kök Hatası + 5 Düzeltme

Doğrulama: tsc 0 hata, test 192/192, build başarılı. Checkbox CSS
düzeltmesi derlenmiş çıktıda doğrulandı; "5.000'e yuvarlanmış" metninin
kalktığı, formül cümlesinin kaldığı gerçek PDF'le doğrulandı.

## 1) Checkbox'lar artık gerçekten çalışıyor — kök neden bulundu

**Uygulama genelini etkileyen bir CSS hatasıydı.** Genel
`input, select, textarea { width:100%; appearance:none; ... }` kuralı
checkbox'ları da kapsıyordu — tarayıcının normal checkbox görünümünü
(kare + tik işareti) tamamen siliyor, geniş boş bir dikdörtgene
dönüştürüyordu. Bu yüzden hem Üst Hakkı'daki "PDF ve Excel'de Göster"
hem Otel'deki "Gelir/İNA/Maliyet" checkbox'ları çalışmıyormuş gibi
görünüyordu. Tek bir CSS düzeltmesiyle **her ikisi de dahil, uygulama
genelindeki tüm checkbox'lar** düzeldi.

## 2) "En yakın 5.000'e yuvarlanmış" ifadesi 6 yerden kaldırıldı

Tarımsal Ürün (uygulama içi + PDF + Excel), Üst Hakkı Toplam Gelir
Üzerinden (PDF + Excel), Otel (PDF) — hepsinde bu açıklayıcı ifade
kaldırıldı. Rakamın kendisi hâlâ 5.000'e yuvarlanmış olarak
hesaplanıyor (yöntem değişmedi), yalnız bunu anlatan metin gitti.

## 3) Gelirler Tablosu oranları artık her alanın yanında belirgin rozet

Önceden tek bir küçük, gri ipucu cümlesindeydi. Şimdi her gelir kalemi
(Yiyecek, Diğer, Toplantı, Dükkan) kutusunun hemen yanında, canlı
güncellenen bir rozet var; Oda Gelirinin payı da ayrı, altın renkli bir
rozetle vurgulanıyor.

## 4) İşletme Giderleri yüzdelerinin yanına döviz karşılığı eklendi

"Oda Gideri %30" gibi her yüzde kutusunun yanında, 1. yıl için o
yüzdenin karşılık geldiği gerçek tutar (rozet olarak) görünüyor.

## 5) Otel'de İNA bölümü artık görsel olarak ayrı, belirgin "OPSİYONEL" rozetli

Önceden Projeksiyon Parametreleri ile aynı kartın içinde, yalnız bir
alt başlıkla ayrılıyordu. Artık **kesikli çerçeveli, ayrı bir kart**
içinde, üstünde net bir "OPSİYONEL" rozeti ve "boş bırakılırsa hesaba
dahil edilmez" açıklamasıyla.

## Bulduğum ama bu pakete EKLEMEDİĞİM bir eksiklik

**Otel modülünde hiç Excel export özelliği yok** — yalnız PDF var. Bu
yüzden "PDF ve Excel'de Göster" yerine yalnız "PDF'te gösterilecek
yöntemler" yazıyor; tutarsızlık değil, gerçek bir eksiklik. Bunu
sessizce eklemek yerine sana soruyorum: Otel'e de (Tarımsal Ürün/Üst
Hakkı gibi) tam bir Excel export ekleyelim mi? Onaylarsan ayrı bir
turda ele alırım.

## Yükleme
1. Zip'i çıkar (`src`, `public`, `package.json`, bu dosya görünecek).
2. github.com/ErhanNTRK/ArsaPlan → **Add file → Upload files**.
3. `src` klasörünün **simgesini** (içine girmeden) sürükle-bırak, aynısını
   `public` klasörü ve `package.json` dosyası için de yap.
4. "Üzerine yazılsın mı?" → **evet**.
5. **Commit changes**.
6. **Actions** sekmesinde yeşil tik belirene kadar bekle (~30-60 sn).
7. Siteyi **Ctrl+F5** ile tazele.
