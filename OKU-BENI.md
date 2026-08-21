# ArsaPlan v9.8.0 — TAKS Boşken Otomatik Zemin Kat (Konut 3-8 Katlı ve Karma Kullanım)

Doğrulama: `tsc -b` 0 hata · `npx vitest run` **339/339 test yeşil** ·
`npm run build` başarılı.

## Bir önceki turda eksik kalan kapsam tamamlandı

v9.7.0'da TAKS boşken otomatik taban oturumu türetmeyi yalnızca **basit
Villa akışına** eklemiştim — **Konut (3-8 Katlı Bina)** ve **Karma
Kullanım** akışlarına hiç yansımamıştı, siz bunu test ederken fark ettiniz.

**Kök neden:** Bu iki akış (`computeApartment`, ortak motor), TAKS'ı
yalnızca **Zemin Kat**'ın otomatik alanını belirlemek için kullanıyor —
normal katlar TAKS'tan bağımsız, "satılabilir alan havuzu"ndan
paylaştırılarak hesaplanıyor. TAKS boşken Zemin Kat'ın otomatik değeri
sıfır kalıyordu.

**Düzeltme:** TAKS girilmemişse, Taban Oturumu (ve Zemin Kat'ın otomatik
değeri) artık şu formülle türetiliyor:

```
Taban Oturumu = Satılabilir Havuz ÷ (1 [Zemin] + Normal Kat Sayısı + Piyes Payı [varsa])
```

- **Konut (3-8 Katlı Bina) ve Karma Kullanım aynı motoru paylaştığı için
  tek düzeltme ikisini birden kapsıyor.**
- TAKS zaten girilen projelerde hiçbir şey değişmiyor.
- Zemin Kat'ı elle girerseniz bu otomatik öneri hiç devreye girmiyor.
- Villa akışındaki (v9.7.0) özellik korunuyor, ayrıca değiştirilmedi.

6 yeni test — biri özellikle "Zemin Kat'ın otomatik alanı artık sıfır
değil" diye sizin bildirdiğiniz sorunu doğrudan doğruluyor.

## Hesaplamalarda değişiklik oldu mu?

**Yalnızca TAKS boş bırakılmış Konut (3-8 Katlı)/Karma Kullanım projelerini
etkiler.** TAKS her zaman girildiği projelerde hiçbir şey değişmiyor.

## Değişen Dosyalar

```
src/engine/apartment.ts   Taban oturumu/Zemin Kat otomatik türetme (havuz+kat sayısı formülü)
src/engine/types.ts       ApartmentCapacity.footprintSuggested
src/engine/apartman-zemin-otomatik.test.ts   YENİ — 6 test
```

## Beklemede — henüz karar verilmedi

- "İndirgenmiş Kat Karşılığı Yöntemi" (bağımsız Maliyet Yaklaşımı'na üçüncü
  yöntem) — şimdilik eklenmiyor.
