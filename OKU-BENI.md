# ArsaPlan v7.2.1 — Otel: Adım Birleştirme + Açılır/Kapanır Bölümler

Doğrulama: tsc 0 hata, test 192/192, build başarılı. Bir önceki
mesajında hatırlattığın maddeler — özür dilerim, uzun Excel analizi
sırasında atlanmıştı, şimdi tamamlandı.

## 1) Adım 2 ve Adım 3 birleştirildi

Otel Gelir Hesabı artık **3 adım** (4 değil): Genel Bilgiler → **Gelirler**
(Oda Gelirleri + Yardımcı İşletme Gelirleri + Ticari Kira, hepsi tek
ekranda) → Gider · Projeksiyon · İNA.

## 2) Maliyet Yaklaşımı ve İNA artık gerçekten kapalı başlıyor

Önceden yalnız kesikli çerçeve ve "OPSİYONEL" rozetiyle görsel olarak
ayrılmışlardı ama içerikleri her zaman açık duruyordu. Şimdi ikisi de
**varsayılan kapalı** — başlığa tıklayınca açılıyor (▸ işareti dönerek
▾ oluyor). Kullanıcı ihtiyacı yoksa hiç görmeden geçebiliyor, dar
ekranda da yer kaplamıyor.

## 3) Paylaşılan veri (Gelir Artış Oranı) — kontrol ettim, zaten tek yerden giriliyor

"Gelir de İNA da kullanılan bir veri varsa İNA'da tekrar sorulmasın"
isteğini kontrol ettim: **Gelir Artış Oranı zaten yalnızca bir yerde**
("Projeksiyon Parametreleri" kartında) soruluyor — İNA'nın kendi ayrı
bir kopyası hiç yok. Yani bu istek zaten yapısal olarak karşılanmış,
ek bir "salt-okunur gösterge" eklemeye gerek kalmadı.

## Yükleme
1. Zip'i çıkar (`src`, `public`, `package.json`, bu dosya görünecek).
2. github.com/ErhanNTRK/ArsaPlan → **Add file → Upload files**.
3. `src` klasörünün **simgesini** (içine girmeden) sürükle-bırak, aynısını
   `public` klasörü ve `package.json` dosyası için de yap.
4. "Üzerine yazılsın mı?" → **evet**.
5. **Commit changes**.
6. **Actions** sekmesinde yeşil tik belirene kadar bekle (~30-60 sn).
7. Siteyi **Ctrl+F5** ile tazele.
