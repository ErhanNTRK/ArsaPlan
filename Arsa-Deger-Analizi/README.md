# Arsa Değer Analizi — Proje Geliştirme Platformu

Bir arsanın imar haklarını, proje kapasitesini ve **Artık Değer (Residual Land Value)**
yöntemiyle arsa değerini hesaplayan, sunucusuz çalışan web uygulaması.

- React + TypeScript + Vite · GitHub Pages üzerinde çalışır
- Tüm hesaplar tarayıcıda yapılır; hiçbir veri sunucuya gitmez
- Mobil öncelikli; telefonda ana ekrana eklenebilir
- Uzman yorumları kural bazlıdır: çevrimdışı çalışır, ücretsizdir, deterministiktir

---

## 1. GitHub'a Yükleme (ilk kurulum)

1. GitHub'da yeni bir repo aç. **Repo adı tam olarak şu olmalı:**

       Arsa-Deger-Analizi

   (Farklı bir ad verirsen `vite.config.ts` içindeki `base` satırını da aynı adla değiştir,
   yoksa site boş sayfa açılır.)

2. Bu paketin içindeki **tüm dosya ve klasörleri** repoya yükle:

       src/  public/  .github/  index.html  package.json  vite.config.ts
       tsconfig.json  tsconfig.app.json  tsconfig.node.json  .gitignore  README.md

   "Commit directly to the main branch" seçili olmalı.

   > `.github` klasörü sürüklenemezse: **Add file → Create new file** de ve dosya adı
   > kutusuna `.github/workflows/deploy.yml` yaz; içeriğini bu paketteki aynı dosyadan kopyala.

3. Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions** seç.

4. **Actions** sekmesinde çalışma yeşil olduğunda site yayında:

       https://<kullanıcı-adın>.github.io/Arsa-Deger-Analizi/

## 2. Güncelleme

Değişen dosyaları aynı şekilde yükle → commit → Actions yeşil → siteyi aç.
Sayfanın altındaki **sürüm damgasının** değiştiğini gör (`v1.0.0 · 2026.07.21`).
Telefonda eski görünüyorsa uygulamayı tamamen kapatıp iki kez aç.

## 3. Akış (9 adım)

    1  Değerleme konusu (konut / ticari / karma) + taşınmaz bilgileri + parsel geometrisi
    2  Konut tipi (villa · 3-6 kat · 7-18 kat · site) — bu sürümde villa aktif
    3  İmar bilgileri: TAKS/KAKS/Hmax **veya** doğrudan alan girişi,
       çekme mesafeleri, bodrum (emsale dahil mi?), çatı arası (emsale dahil mi?)
    4  Villa özellikleri
    5  Yapım maliyeti (2026 tebliği + enflasyon + elle giriş)
    6  Peyzaj, altyapı ve bahçe satış değeri
    7  Satış birim değeri
    8  Müteahhit kârı ve finansman
    9  Kat karşılığı paylaşımı
    →  Sonuç ekranı: KPI kartları, kapasite, fizibilite, kat karşılığı,
       uzman değerlendirmesi · **PDF ve Excel indirme**

## 4. Proje Yapısı

    src/engine/          Saf TypeScript hesap motoru — React bilmez, test edilebilir
      types.ts           Veri modeli
      capacity.ts        Zarf → taban → villa adedi (TAKS/KAKS veya doğrudan alan)
      financial.ts       Maliyet, peyzaj, hasılat, artık değer, kat karşılığı
      advisor.ts         Kural bazlı uzman yorumları
      engine.test.ts     Golden testler (elle doğrulanmış sayılar)
    src/ui/              Arayüz bileşenleri ve tasarım sistemi
    src/data/            2026 Bakanlık birim maliyetleri
    src/export/          PDF (jsPDF + gömülü Türkçe font) ve Excel (ExcelJS)

Dışa aktarma modülleri **yalnızca butona basıldığında** indirilir; uygulamanın
ilk açılışı bu yüzden hafiftir (~62 KB).

**Kural:** hesap mantığı yalnızca `src/engine` içinde yaşar. Arayüz değişikliği
motoru bozamaz; motor değişikliği testlerle korunur.

## 5. Yeni Yıl Birim Maliyetleri

`src/data/yapiSiniflari.ts` dosyasındaki `unitCost` değerlerini yeni tebliğe göre
güncelle. Başka hiçbir dosyaya dokunmana gerek yok.

Mevcut kaynak: **RG 3.2.2026 · Sayı 33157** — 2026 Yılı Yapı Yaklaşık Birim Maliyetleri.
Tutarlar KDV hariçtir; %15 genel gider ve %10 yüklenici kârı dahildir.

## 6. Geliştirici Komutları (isteğe bağlı)

    npm install       bağımlılıkları kur
    npm run dev       yerel geliştirme sunucusu
    npm test          motor + arayüz + dışa aktarma testleri (46 test)
    npm run build     üretim derlemesi

## 7. Sınırlar (dürüst notlar)

- **Villa adedi bir tahmindir.** Yapılaşma zarfı ve yerleşim verimliliği üzerinden
  üretilir; kesin adet mimari avan projeyle belirlenir. Uygulama bu yüzden tek sayı
  değil **aralık** verir ve hangi kısıtın bağlayıcı olduğunu daima yazar.
- **Parsel dikdörtgen kabul edilir.** Düzensiz geometride en/boy yaklaşık girilmeli,
  sonuç yaklaşık kabul edilmelidir.
- **Varsayımlar kullanıcıya aittir.** Satış fiyatı, kâr oranı, finansman ve güncelleme
  oranları emsal araştırmasıyla desteklenmelidir.
- İlk sürümde yalnızca **Villa** senaryosu hesaplanır; 3-6 katlı apartman, 7-18 katlı
  blok ve site tipleri aynı motor üzerine sırayla eklenecektir.
- Bodrum ve çatı arasının emsale dahil olup olmadığı **plan notundan teyit edilmelidir**;
  uygulama bu kararı sizin adınıza veremez, yalnızca sonucunu hesaplar.
