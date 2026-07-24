# Otel Gelir Hesabı Modülü — v5.6.0 Yükleme Paketi

Bu paket, ArsaPlan v5.5.0 üzerine **Otel Gelir Hesabı** modülünü ekler ve sürümü
v5.6.0 olarak mühürler. Mevcut "Arsa Gelir Projeksiyon Yöntemi" akışının motoruna
ve testlerine dokunulmamıştır. Doğrulama bu paketin çıktığı kopyada yapılmıştır:
`npx tsc -b` → 0 hata · `npx vitest run` → **131/131** · `npm run build` → başarılı.

## Paketteki dosyalar (klasör yapısı GitHub'daki yapıyla birebir aynıdır)

YENİ:
- src/hotel/types.ts
- src/hotel/engine.ts
- src/hotel/engine.test.ts
- src/hotel/HotelApp.tsx
- src/hotel/pdf.ts

ÜZERİNE YAZILACAK:
- src/App.tsx            (başlangıçta yöntem seçim ekranı; mevcut akış ArsaApp adıyla aynen korunur)
- src/ui/styles.css      (yalnız dosya sonuna otel CSS'leri eklendi)
- src/brand/brand.ts     (sürüm: v5.6.0 · 2026.07.24)
- package.json           (5.6.0)
- package-lock.json      (yalnız sürüm alanları 5.6.0)
- README.md              (v5.6.0 changelog eklendi)

## GitHub üzerinden yükleme

1. https://github.com/ErhanNTRK/ArsaPlan → **Add file → Upload files**
2. Bu zip'i bilgisayarında AÇ ve içindeki **src klasörünü, package.json,
   package-lock.json ve README.md dosyalarını** sürükleyip bırak
   (Chrome/Edge klasör yapısını koruyarak yükler; aynı isimli dosyaların
   üzerine yazılacağını GitHub kendisi bildirir).
3. Commit mesajı örn. `v5.6.0 — Otel Gelir Hesabı modülü` → **Commit changes**.
4. Birkaç dakika içinde: https://erhanntrk.github.io/ArsaPlan/

ÖNEMLİ: src/App.tsx ve src/ui/styles.css mutlaka üzerine yazılmalıdır;
ikisinden biri eski kalırsa derleme kırılır veya otel ekranı stilsiz görünür.
