# ArsaPlan v7.8.0 — KML Senkron Hatası + Şerefiye + Yatay Düzen + Yıl Format

Doğrulama: tsc 0 hata, test 193/193, build başarılı.

## 1) KML / Net Parsel Alanı senkron hatası düzeltildi (kritik)

KML yüklenince yalnız **Parsel Alanı** güncelleniyordu, **Net Parsel
Alanı** eski değerde kalıyordu — bu tutarsızlık fark edilmeden Devam
butonuna basılabiliyordu. Artık KML yüklenince ikisi de aynı değere
eşitleniyor; kullanıcı isterse Net Parsel Alanı'nı sonradan elle
değiştirebilir.

## 2) Şerefiye — Otel Maliyet Yaklaşımı'na eklendi

Arsa+Yapı değerlerinin altına, opsiyonel bir "Şerefiye" tutarı
girilebiliyor — nihai Maliyet Yaklaşımı Değeri'ne ekleniyor. PDF ve
Excel'de de (yalnız değer girilmişse) ayrı bir satır olarak görünüyor.
Konuştuğumuz gibi açıklayıcı bir metin eklenmedi.

## 3) Arsa'da iki dar kart tam genişliğe alındı

"Yapılar" ve "İlave Maliyetler" kartları (Ticari/İşletme modülü) artık
tam ekran genişliğinde — önceki `card-wide` düzeltmesiyle aynı desen.

## 4) Otel "Başlangıç Yılı" artık binlik ayırıcı almıyor

"2026" yerine "2.026" gösteren hata düzeltildi — bu alan için
`Num` bileşenine yeni bir "plain" modu eklendi (yalnız burada
kullanılıyor, diğer para/miktar alanları etkilenmedi).

## Bu turda dokunulmayan, kapanan konular

- Kademeli doluluk modeli — eklenmeyecek (onayladın).
- Emsal Karşılaştırma / Kira Kapitalizasyonu / Deprem Riski — eklenmeyecek.
- Sistem mimarisini baştan kurma (döviz/Excel deseni merkezi hale
  getirme) — riski faydasından yüksek, dokunulmadı.
- Kat Tablosu şablon-kopyalama — zaten otomatik eşitleme çalışıyor,
  ek özelliğe gerek yok.

## Yükleme
`src`/`public`/`package.json` → GitHub Upload files → üzerine yaz →
Commit → Actions yeşile dönene kadar bekle → Ctrl+F5.
