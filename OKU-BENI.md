# ArsaPlan v7.5.1 — Gerçek Kök Neden Bulundu: card-wide

Doğrulama: tsc 0 hata, test 193/193, build başarılı. `card-wide`
kuralının hem CSS'te hem derlenmiş JS'te var olduğu doğrulandı.

## Neden önceki "ızgara" denemeleri görsel olarak işe yaramamıştı

`.cols` (sayfa genel iki-sütunlu grid'i) her kartı **otomatik olarak
yarım genişliğe** sıkıştırıyordu. İçindeki flex/grid düzenlemelerim
teknik olarak doğruydu ama kap (kart) zaten dar olduğu için görsel
sonuç hep dikey/dar kaldı. Kodda **zaten bir kaçış yolu vardı**
(`card-wide` sınıfı, tam genişlik veriyor) ama bunu ilgili kartlara
hiç eklememişim — bu turda düzeltildi.

## Tam genişlik verilen kartlar

**Otel:** İşletme Gideri, Projeksiyon Parametreleri, Maliyet Yaklaşımı,
İNA, Yıllık Projeksiyon Tablosu.
**Arsa:** Kat Tablosu.

Bu, "yatay/ızgara" sözünün bu sefer **gerçekten** görsel karşılığı
olacağı anlamına geliyor — derlenmiş çıktıda doğruladım.

## Henüz kodlanmayan, bekleyen notlar (ayrı turda)

- Maliyet/İNA verisi girilmişse açık gelsin (details varsayılan durumu)
- `loadDraft()`'a eksik alanlar eklenip veri kaybı düzeltilmesi
- Risksiz/Risk Primi örnek metinlerinin Türkiye gerçeğine + döviz
  seçimine göre güncellenmesi
- Üzüm çeşitleri (Sultaniye vb.) + doğrulanmış tarım katalog güncellemesi

## Yükleme
`src`/`public`/`package.json` → GitHub Upload files → üzerine yaz →
Commit → Actions yeşile dönene kadar bekle → Ctrl+F5.
