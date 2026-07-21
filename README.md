# ArsaPlan — Arsa Değer Analizi ve Proje Geliştirme

**Dora Gayrimenkul Değerleme A.Ş. tarafından hazırlanmıştır** · Düzenleyen: Hasan Erhan Öntürk

Bir arsanın imar haklarını, proje kapasitesini ve **Artık Değer (Residual Land Value)**
yöntemiyle arsa değerini hesaplayan, sunucusuz çalışan web uygulaması.

- React + TypeScript + Vite · GitHub Pages üzerinde çalışır
- Tüm hesaplar tarayıcıda yapılır; hiçbir veri sunucuya gitmez
- Mobil öncelikli; telefonda ana ekrana eklenebilir
- Uzman yorumları kural bazlıdır: çevrimdışı çalışır, ücretsizdir, deterministiktir

---

## 1. GitHub'a Yükleme (ilk kurulum)

1. GitHub'daki reponu kullan (adı ne olursa olsun — `ArsaPlan`, `Arsa-Deger-Analizi`…).
   Bu sürümde yollar göreli (`base: './'`) olduğu için **repo adını değiştirsen bile
   site çalışır**; artık `vite.config.ts` düzenlemene gerek yok.

2. Bu paketin içindeki **tüm dosya ve klasörleri** repoya yükle:

       src/  public/  index.html  package.json  vite.config.ts
       tsconfig.json  tsconfig.app.json  tsconfig.node.json  .gitignore  README.md

   **Önemli:** Sürüklemede dosyaları ve klasörleri KARIŞTIRMAYIN. Önce kök dosyaları
   (index.html, package.json, vite.config.ts, tsconfig*.json, .gitignore, README.md)
   birlikte sürükleyip commit edin; sonra ayrı bir yüklemede `src` klasörünü,
   sonra yine ayrı olarak `public` klasörünü sürükleyin. Karışık sürükleme,
   GitHub yükleyicisinde içeriklerin yanlış dosya adlarına yazılmasına yol açabiliyor.

   "Commit directly to the main branch" seçili olmalı.

   > **Not:** Bu pakette `.github` klasörü YOKTUR. Repondaki mevcut
   > `.github/workflows/main.yml` dosyası işini görüyor; ikinci bir workflow eklemeyiniz.

3. Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions** seç.

4. **Actions** sekmesinde çalışma yeşil olduğunda site yayında:

       https://<kullanıcı-adın>.github.io/<repo-adı>/

## 2. Güncelleme

Değişen dosyaları aynı şekilde yükle → commit → Actions yeşil → siteyi aç.
Sayfanın altındaki **sürüm damgasının** değiştiğini gör (`v1.0.0 · 2026.07.21`).
Telefonda eski görünüyorsa uygulamayı tamamen kapatıp iki kez aç.

## 3. Akış (4 adım)

    1  Taşınmaz — ne değerleniyor (konut/ticari/karma) + parsel kimliği ve alanları
    2  İmar ve Proje — lejant (liste), TAKS/KAKS/Hmax **veya** doğrudan alan girişi,
       çekme mesafeleri (opsiyonel), emsal dışı alanlar, konut tipi, villa kurgusu
       ve canlı kapasite önizlemesi — hepsi tek ekranda
    3  Maliyet ve Satış — 2026 tebliği + güncelleme oranı + elle giriş,
       peyzaj/bahçe (alan otomatik gelir, elle değiştirilebilir), satış birim değeri
    4  Değerleme — müteahhit kârı, finansman oranı, kat karşılığı (açılır/kapanır)
    →  Sonuç ekranı: KPI kartları, kapasite dökümü, fizibilite,
       uzman değerlendirmesi · **PDF ve Excel indirme** (Dora logolu)

### Villa kat mantığı

Girilen **kat adedi bodrumu içerir**, çatı arasını içermez:

    bodrum yok  · 2 kat → zemin + 1. normal kat        → zemin üstü 2 kat
    bodrum var  · 2 kat → bodrum + zemin               → zemin üstü 1 kat
    bodrum var  · 4 kat → bodrum + zemin + 2 normal    → zemin üstü 3 kat

Villa taban alanı = villa alanı ÷ zemin üstü kat adedi. Çatı arası kat sayısına
girmez ama alan ve maliyet hesabına girer.

### Bahçe ve satılabilir alan

- **Bahçe alanı** = net parsel − **toplam zemin oturumu**. TAKS tanımlıysa yasal taban
  alanı hakkı esas alınır (fiili oturum daha küçük olsa bile).
- **Satılabilir alan yalnızca KAPALI alandır.** Bahçe satılabilir alana girmez;
  ayrıca fiyatlandırılırsa hasılata ayrı kalem olarak eklenir.

### Emsal dışı satılabilir alan

Bir alanın **emsale dahil olması** ile **satılabilir olması** ayrı sorulardır.
Bodrum ve çatı arası için ikisi ayrı ayrı sorulur; ayrıca villa başına
"diğer emsal dışı satılabilir alan" girilebilir (kapalı balkon, teras, eklenti…).

    Örnek: emsale konu 500 m² + emsal dışı satılabilir 50 m² = 550 m² satılabilir alan

Sonuç ekranı ve çıktılar bu ayrımı üç satır hâlinde gösterir.

## 4. Proje Yapısı

    src/engine/          Saf TypeScript hesap motoru — React bilmez, test edilebilir
      types.ts           Veri modeli
      capacity.ts        Zarf → taban → villa adedi (TAKS/KAKS veya doğrudan alan)
      financial.ts       Maliyet, peyzaj, hasılat, artık değer, kat karşılığı
      advisor.ts         Kural bazlı uzman yorumları
      engine.test.ts     Golden testler (elle doğrulanmış sayılar)
    src/ui/              Arayüz bileşenleri ve tasarım sistemi
    src/data/            2026 Bakanlık birim maliyetleri + plan lejantları
    src/export/          PDF (jsPDF + gömülü Türkçe font) ve Excel (ExcelJS)
    src/brand/           Kurumsal kimlik: Dora logosu (gömülü) ve ibare metinleri
    public/dora-logo.png Arayüzde kullanılan logo

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
    npm test          motor + arayüz + dışa aktarma testleri (58 test)
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
- **Kat karşılığı yöntemi ile artık değer yöntemi farklı sonuç verebilir.** Bu doğaldır:
  biri paylaşım oranından, diğeri proje ekonomisinden hareket eder. İstemezseniz
  kat karşılığı bölümünü Adım 5'ten kapatabilirsiniz.
