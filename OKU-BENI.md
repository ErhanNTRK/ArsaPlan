# ArsaPlan v7.0.0 — Excel İçe Aktarma (5 Modül)

Doğrulama: tsc 0 hata, test 192/192, build başarılı. Mekanizma önce
bağımsız test edildi, sonra **gerçek dışa aktarma → içe aktarma
round-trip'i** iki farklı modülde (Tarımsal Ürün — basit, ve Toplam
Gelir Üzerinden Üst Hakkı — iç içe diziler içeren en karmaşık yapı)
birebir eşleşme ile doğrulandı.

## Nasıl çalışıyor

Kırılgan bir yaklaşımdan (Excel'deki "güzel" formatlı sayıları — binlik
ayırıcı, para birimi sembolü dahil — geri ayrıştırmaya çalışmak) kasıtlı
olarak kaçınıldı. Bunun yerine: her Excel dosyasına **gizli bir veri
sayfası** ekleniyor, bu sayfa girdinin ham JSON'unu taşıyor. "Excel
Yükle" düğmesi bu gizli sayfayı okuyup formu **birebir** dolduruyor —
görünür/bankaya sunulan sayfa hiç etkilenmiyor, kullanıcı normal
Excel'i gördüğü gibi görmeye devam ediyor.

**Sınır (bilerek):** Kullanıcı Excel'deki görünen bir sayıyı elle
değiştirip geri yüklerse bu değişiklik yansımaz — yalnızca ilk dışa
aktarma anındaki veri geri gelir. Senin isteğin ("excel alıp başkasına
iletmek, yeni kullanıcı yükleyince verileri birebir görmek") tam olarak
bu.

## Eklenen modüller (5)

- **Tarımsal Ürün Gelir Hesabı**
- **Akaryakıt Gelir Hesabı**
- **Toplam Değerden Üst Hakkı Hesabı**
- **Sadece Arsa Değeri Üzerinden Üst Hakkı Hesabı**
- **Toplam Gelir Üzerinden Üst Hakkı Hesabı**

Her birinde artık "↺ Sayfayı Sıfırla" düğmesinin yanında **"📂 Excel
Yükle"** var — daha önce o modülden indirilen bir .xlsx dosyasını
seçince form birebir doluyor.

## Bu pakette YAPILMAYAN (dürüst sınır)

**Arsa Gelir Projeksiyonu ve Otel Gelir Hesabı'na eklenmedi.** Bu ikisi
çok daha büyük/karmaşık veri modellerine sahip (çok adımlı sihirbaz,
onlarca iç içe alan) — aynı güvenilirlikte round-trip testi yapmadan
eklemek istemedim. Ayrı bir tur olarak kalıyor, istersen ele alalım.

## Yükleme
1. Zip'i çıkar (`src`, `public`, `package.json`, bu dosya görünecek).
2. github.com/ErhanNTRK/ArsaPlan → **Add file → Upload files**.
3. `src` klasörünün **simgesini** (içine girmeden) sürükle-bırak, aynısını
   `public` klasörü ve `package.json` dosyası için de yap.
4. "Üzerine yazılsın mı?" → **evet**.
5. **Commit changes**.
6. **Actions** sekmesinde yeşil tik belirene kadar bekle (~30-60 sn).
7. Siteyi **Ctrl+F5** ile tazele.
