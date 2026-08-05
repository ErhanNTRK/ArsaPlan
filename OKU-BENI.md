# ArsaPlan v7.9.0 — Canlı Özet Çubuğu (7 Modül) + Otel Hazır Profilleri

Doğrulama: tsc 0 hata, test 193/193, build başarılı.

## 1) Canlı özet çubuğu artık 7 modülün 7'sinde de var

Tarım, Akaryakıt, Üst Hakkı'nın üç yöntemi ve Arsa — hepsine, o
modüle en uygun 2-3 rakamı (Otel'deki gibi, her adımda görünen,
veri girdikçe canlı güncellenen) gösteren üst çubuk eklendi.

## 2) Üzüm çeşitleri eklendi

Sultaniye, Papazkarası, Öküzgözü, Boğazkere, Emir — senin verdiğin
verim/fiyat/gider rakamlarıyla, tarımsal katalogda genel üzüm bağı
kalemlerinin yanına eklendi.

## 3) Otel'e "Hazır Profil ile Başla" eklendi

Adım 2'de, henüz hiç oda girilmemişse 5 hazır profil kartı çıkıyor
(Ekonomik Şehir Oteli, Orta Segment İş Oteli, Üst Segment Şehir Oteli,
Sahil Resort, Butik Otel) — birine tıklayınca Oda Sayısı/ADR/Doluluk/
Gün + İşletme Gideri Oranı + Kapitalizasyon Oranı otomatik doluyor.
**Açıkça "ÖRNEK/başlangıç verisi" olarak etiketlendi** — gerçek piyasa
verisi olmadığı, yalnızca hızlı bir başlangıç noktası sunduğu net
yazılı.

## Dürüst not — hâlâ açık kalan bir denetim

Arsa modülünde (Steps.tsx + StepsApartment.tsx) toplam **23 kart**
hâlâ `card-wide` almamış durumda. Geçen turda yalnız en belirgin
ikisini (Yapılar, İlave Maliyetler) düzelttim. Kalan 23 kartın
hepsini "gerçekten dar mı, yoksa iki-yan-yana durması zaten doğru mu"
diye tek tek doğrulamadım — bunu gizlemek istemedim, açık bir madde
olarak burada duruyor. İstersen bir sonraki turda bunu ele alalım.

## Yükleme
`src`/`public`/`package.json` → GitHub Upload files → üzerine yaz →
Commit → Actions yeşile dönene kadar bekle → Ctrl+F5.
