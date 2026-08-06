# ArsaPlan v8.0.1 — Kritik Hata: Normal Katlar NaN Oluyordu (KRİTİK DÜZELTME)

Doğrulama: tsc 0 hata, test 194/194 (yeni regresyon testi dahil),
build başarılı.

## Kesin kök neden bulundu ve düzeltildi

Senin gönderdiğin ekran görüntüleri sayesinde kesin teşhis kondu:
**Bodrum Kat'ın "Satılabilir alan var mı?" seçimi belirli bir
durumdayken (kullanım tipi "konut"/satılabilir) VE Bodrum Kat Alanı
ile Kayıp Oranı elle girilmemişse, motor `NaN` (sayısal olmayan bir
değer) üretiyordu.** Bu NaN, "satılabilir alan havuzu" mekanizması
üzerinden **tüm normal katlara yayılıyordu** — bu yüzden normal
katlar boş/0 görünüyordu, "otomatik hesaplamıyor" izlenimi
oluşuyordu. Aslında motorun kendi mantığı (Hmax'tan kat sayısı
önerisi, havuzdan pay dağıtımı) doğru çalışıyordu — yalnız tek bir
eksik varsayılan değer (`lossRate`) tüm hesabı bozuyordu.

Artık Kayıp Oranı elle girilmezse **%10 varsayılan** kullanılıyor,
NaN hiç oluşmuyor. Bu senaryoyu birebir tekrar eden bir **regresyon
testi** de eklendi — bu hata bir daha sessizce geri gelemez.

## Ayrıca fark ettiğim, ayrı bir konu (senin dikkatini çekmek isterim)

Ekran görüntülerinde "2. Normal Kat" ve "3. Normal Kat" kutularında
gerçekçi olmayan büyük sayılar (3.517 m², 2.168 m²) vardı — bunlar
muhtemelen **önceki bir TAKS/KAKS/Hmax denemesinden kalma, elle
girilmiş (kilitli) değerler.** TAKS/KAKS/Hmax'ı değiştirdiğinde,
daha önce elle girdiğin kat alanları **otomatik temizlenmiyor** —
bu bilinçli bir tasarım (uzman kullanıcı bir katı özellikle
sabitleyebilsin diye) ama zoning parametreleri değişince kafa
karıştırıcı olabiliyor. Kat Tablosu'nda ilgili kutunun yanındaki
**"↺" simgesine tıklayarak** o kutuyu tekrar otomatik moda
döndürebilirsin. İstersen, "TAKS/KAKS/Hmax değiştiğinde elle
girilmiş kat alanları varsa uyar" gibi bir iyileştirmeyi ayrı bir
madde olarak ele alabiliriz — şimdilik dokunmadım.

## Yükleme
`src`/`public`/`package.json` → GitHub Upload files → üzerine yaz →
Commit → Actions yeşile dönene kadar bekle → Ctrl+F5.
