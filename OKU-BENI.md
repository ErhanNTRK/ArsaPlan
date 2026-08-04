# ArsaPlan v7.4.0 — Excel İndir/Yükle Artık Tüm 7 Modülde

Doğrulama: tsc 0 hata, test 193/193, build başarılı. Otel'in round-trip'i
(gerçek Excel üretilip geri okunarak) birebir eşleşmeyle doğrulandı.

## Tamamlanan modüller

- **Arsa Gelir Projeksiyonu** — Excel Yükle eksikti (indirme zaten
  vardı), eklendi.
- **Otel Gelir Hesabı** — hem Excel İndir hem Excel Yükle **sıfırdan**
  eklendi (Gelir Özeti, Seçilen Nihai Yöntem, Yöntemlerin
  Karşılaştırması, Maliyet Yaklaşımı detayı, Yıllık Projeksiyon Tablosu
  içeren tam bir rapor).
- Tarımsal Ürün, Akaryakıt, Üst Hakkı'nın üç yöntemi zaten vardı,
  değişmedi.

**Artık 7 modülün 7'sinde de Excel İndir + Excel Yükle çalışıyor.**

## İndir/Yükle mantığının özeti (senin istediğin gibi)

Her Excel dosyasına, görünmeyen (gizli) bir **"_data" sayfası**
ekleniyor — bu sayfa, o anki tüm girdi verisinin ham bir kopyasını
taşıyor. "Excel Yükle" düğmesi bu gizli sayfayı okuyup formu **birebir**
dolduruyor.

**Neden bu yöntem seçildi:** Excel'in "güzel", bankaya sunulan
sayfasındaki formatlanmış sayıları (binlik ayırıcı, para birimi
sembolü dahil) geri okumaya çalışmak kırılgandır — küçük bir format
farkı bile veri kaybına yol açabilir. Gizli veri sayfası bu riski
tamamen ortadan kaldırıyor: round-trip (indir → yükle) **her zaman**
birebir çalışıyor, format nasıl görünürse görünsün.

**Sınırı:** Excel'de görünen bir sayıyı elle değiştirip geri yüklersen,
bu değişiklik yansımaz — yalnızca ilk indirme anındaki veri geri gelir.
Amaç zaten bu: "bir kullanıcı Excel'i alıp başka bir kullanıcıya
iletsin, o kullanıcı yükleyince verileri birebir görsün."

4 modülde (Tarımsal, Akaryakıt, Üst Hakkı×2) bu özet artık **uygulama
içinde de**, "Excel Yükle" düğmesinin hemen altında görünür bir not
olarak duruyor. Arsa ve Otel'de topbar dar olduğu için bu açıklama
düğmenin üzerine gelince (title/tooltip) çıkıyor.

## Yükleme
1. Zip'i çıkar (`src`, `public`, `package.json`, bu dosya görünecek).
2. github.com/ErhanNTRK/ArsaPlan → **Add file → Upload files**.
3. `src` klasörünün **simgesini** (içine girmeden) sürükle-bırak, aynısını
   `public` klasörü ve `package.json` dosyası için de yap.
4. "Üzerine yazılsın mı?" → **evet**.
5. **Commit changes**.
6. **Actions** sekmesinde yeşil tik belirene kadar bekle (~30-60 sn).
7. Siteyi **Ctrl+F5** ile tazele.
