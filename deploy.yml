# ArsaPlan — Arsa Değer Analizi ve Proje Geliştirme

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

       src/  public/  .github/  index.html  package.json  vite.config.ts
       tsconfig.json  tsconfig.app.json  tsconfig.node.json  .gitignore  README.md

   "Commit directly to the main branch" seçili olmalı.

   > `.github` klasörü sürüklenemezse: **Add file → Create new file** de ve dosya adı
   > kutusuna `.github/workflows/deploy.yml` yaz; içeriğini bu paketteki aynı dosyadan kopyala.

3. Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions** seç.

4. **Actions** sekmesinde çalışma yeşil olduğunda site yayında:

       https://<kullanıcı-adın>.github.io/<repo-adı>/

## 2. Güncelleme

Değişen dosyaları aynı şekilde yükle → commit → Actions yeşil → siteyi aç.
Sayfanın altındaki **sürüm damgasının** değiştiğini gör (`v1.0.0 · 2026.07.21`).
Telefonda eski görünüyorsa uygulamayı tamamen kapatıp iki kez aç.

## 3. Akış (5 adım)

    1  Taşınmaz — ne değerleniyor (konut/ticari/karma) + parsel kimliği ve alanları
    2  İmar Durumu — lejant (liste), TAKS/KAKS/Hmax **veya** doğrudan alan girişi,
       çekme mesafeleri (opsiyonel), bodrum ve çatı arası emsal kararları, plan notları
    3  Proje — imar haklarına göre kapasite özeti, konut tipi ve villa kurgusu:
       villa büyüklüğünden adede **veya** villa adedinden büyüklüğe
    4  Maliyet ve Satış — 2026 tebliği + güncelleme oranı + elle giriş,
       peyzaj/bahçe (alan otomatik gelir, elle değiştirilebilir), satış birim değeri
    5  Değerleme — müteahhit kârı, finansman oranı, kat karşılığı (açılır/kapanır)
    →  Sonuç ekranı: KPI kartları, kapasite dökümü, fizibilite,
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
    npm test          motor + arayüz + dışa aktarma testleri (50 test)
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
