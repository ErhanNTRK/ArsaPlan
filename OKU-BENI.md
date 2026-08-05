# ArsaPlan v7.6.0 — Otel: 3 Düzeltme

Doğrulama: tsc 0 hata, test 193/193, build başarılı.

## 1) Maliyet/İNA artık veri girilince adım değiştirse de açık kalıyor

Kök neden: bu bölümler adım değişince React'te yeniden monte oluyordu,
`<details>`'ın kendi açık/kapalı hafızası sıfırlanıyordu. Açık/kapalı
durumu artık hiç kaybolmayan üst seviye bir hafızada tutuluyor; ayrıca
**veri varsa her zaman açık** kalıyor (elle kapatılsa bile bir sonraki
değişiklikte tekrar açılır) — tam istediğin davranış.

## 2) "Otomatik Performans Göstergeleri" (ADR/Doluluk/RevPAR) kaldırıldı

## 3) Üst özet çubuğu artık İNA ve Maliyet Yaklaşımı'nı da gösteriyor

Önceden yalnız Toplam Gelir/Gider/NOI/Kapitalizasyon vardı. Artık her
adımda (Sonuç sayfası hariç), veri girildikçe **canlı güncellenen**:
Toplam Gelir, Gelir (Direkt Kap.), İNA (varsa), Maliyet Yaklaşımı
(varsa) — son sayfaya gelmeden anlık değeri görebiliyorsun.

## Yükleme
`src`/`public`/`package.json` → GitHub Upload files → üzerine yaz →
Commit → Actions yeşile dönene kadar bekle → Ctrl+F5.
