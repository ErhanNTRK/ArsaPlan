# ArsaPlan — Arsa Değer Analizi ve Proje Geliştirme

**Dora Gayrimenkul Değerleme A.Ş. tarafından hazırlanmıştır**
Düzenleyen: Hasan Erhan Öntürk · erhan.onturk@doradegerleme.com.tr

Bir arsanın imar haklarını, proje kapasitesini ve **Artık Değer (Residual Land Value)**
yöntemiyle arsa değerini hesaplayan, sunucusuz çalışan web uygulaması.

- React + TypeScript + Vite · GitHub Pages üzerinde çalışır
- Tüm hesaplar tarayıcıda yapılır; hiçbir veri sunucuya gitmez
- Mobil öncelikli; telefonda ana ekrana eklenebilir
- Uzman yorumları kural bazlıdır: çevrimdışı çalışır, ücretsizdir, deterministiktir

**v5.1.0 (2026.07.22)** — Üç yeni değerleme yolu eklendi. **Karma Kullanım:**
proje tipi sorulmadan çok katlı kurguya geçilir; zemin kat ticari, bodrumlarda
ortak/ticari/konut seçimi, asma kat desteği (varsayılan alan = zemin × %40,
emsale dahilse havuzdan sabit düşer) ve altı birim değerli fiyatlama
(bodrum ticari/konut · zemin · asma · normal · piyes). **Ticari Apartman:**
karma ile birebir aynı motor. **Ticari İşletme:** ekle-mantığıyla yapı satırları
(fabrika, depo, ahır, otel…), tebliğ maliyeti × güncelleme × (1 − yıpranma),
ilave maliyetler (çevre duvarı/peyzaj/altyapı + serbest kalemler) ve tek toplam
satış değeri; arsa değeri = satış − maliyet, müteahhit kârı kesilmez, kat
karşılığı ve uzman değerlendirmesi uygulanmaz. PDF, Excel ve Özet JPEG üç yol
için de uyarlandı.

**v5.0.0 (2026.07.22)** — Kurumsal görsel dil yenilendi (lacivert + altın; künye,
sonuç şeridi, zebra tablolar, büyütülmüş Dora logosu). "Artık Değer" ifadesi tüm
uygulamada **Gelir Projeksiyonu** oldu. Rapor kimliği: "Bu rapor ArsaPlan ile
hazırlanmıştır · Geliştirici: Dora Gayrimenkul Değerleme A.Ş. · Erhan Öntürk".
Yeni çıktılar: **Özet JPEG** (tek sayfalık görsel — banka sistemine/Word'e uygun)
ve **Uzman Notu PDF** (ayrı belge; ana rapor artık uzman değerlendirmesi içermez).
Menü: "Çok Katlı Bina" adı, sınırsız normal kat sayısı, 7-18 Katlı Blok kaldırıldı,
Site listenin sonuna alındı.

**v4.2.0 (2026.07.22)** — Yeni proje tipi: **3-8 Katlı Bina**. İki hesap yöntemi:
*TAKS/KAKS* (satılabilir alan hakkı bodrum ve zeminden düşülüp normal katlara ve
emsale dahil çatı arası piyesine otomatik dağıtılır; Hmax'tan kat adedi türetilir;
elle girilen değerler sabit kalır) ve *Doğrudan Alan* (kat tablosuna elle giriş,
1. normal kat diğerlerine kopyalanır). Maliyet toplam kat alanı, gelir kat tipine
göre birim değerler (bodrum / zemin / normal / piyes) üzerinden hesaplanır.
Ayrıca: "Fiyat Düşüşüne Dayanım" satırı tüm rapor görünümlerinden kaldırıldı;
kat adedi satırı yalnızca PDF'ten çıkarıldı (Excel ve uygulamada durur).

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

    1  Değerleme Konusu — konut / ticari (yakında) / karma (yakında)
    2  Proje Tipi ve Taşınmaz — villa / 3-6 kat / 7-18 kat / site + parsel bilgileri
    3  İmar ve Alan Üretimi — lejant, TAKS/KAKS **veya** doğrudan alan girişi,
       emsal dışı satılabilir alan, çatı katı, bodrum kat, villa dağılımı (opsiyonel)
       ve canlı toplam inşaat alanı dökümü
    4  Maliyet ve Satış — 2026 tebliği + güncelleme oranı + elle giriş,
       peyzaj/bahçe (alan otomatik gelir, elle değiştirilebilir), satış birim değeri
    5  Değerleme — müteahhit kârı, finansman oranı, yöntem karşılaştırması (açılır/kapanır)
    →  Sonuç ekranı: KPI kartları, kapasite dökümü, fizibilite,
       uzman değerlendirmesi · **PDF ve Excel indirme** (Dora logolu)

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
    npm test          motor + arayüz + dışa aktarma testleri (49 test)
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
