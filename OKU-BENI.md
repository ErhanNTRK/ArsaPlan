# ArsaPlan v6.0.1 — Gerçek Düzeltmeler + Tarımsal Ürün Tam İnşası

Doğrulama: `npx tsc -b` → 0 hata · `npm run test` → **161/161** (v6.0.0'daki
153 + yeni 8 tarımsal golden) · `npm run build` → başarılı · oxlint → 0 hata.
Her düzeltme bu kez **gerçek PDF/Excel üretip metin+görsel olarak** kontrol
edildi — "yazdım ama bağlamadım" hatası bu pakette tekrarlanmadı.

## Bu pakette gerçekten düzelenler (öncekinde YAZILMIŞ ama BAĞLANMAMIŞTI)

1. **Geniş ekran düzeni artık gerçekten çalışıyor.** `src/styles.css` daha
   önce yazılmış ama `main.tsx` yalnızca `ui/styles.css`'i çağırıyordu — CSS
   hiç yüklenmiyordu. İkinci import satırı eklendi; derlenmiş `dist` çıktısında
   `1500px`/`1620px` kurallarının gerçekten var olduğu doğrulandı.
2. **PDF kat tablosu düzeltildi.** Dört kolon (Kat Bilgisi / Kat Alanı /
   Satılabilir Alan / Ortak Alan) artık gerçek başlıklarla, elle kaydırma
   olmadan doğru hizada. Gerçek PDF üretilip `pdftotext` ile TOPLAM satırının
   üç sayısının doğru kolona denk geldiği kanıtlandı.
3. **Günümüze indirgeme arayüze bağlandı.** Motor (`financial.ts`) zaten
   vardı ama hiçbir ekranda soran kutu yoktu. Step 5'e "Proje Süresi (ay)" +
   "Yıllık İndirgeme Oranı" eklendi; Sonuç ekranına ve PDF'e "İndirgemeli Arsa
   Değeri" satırı eklendi — hem Kat Karşılığı hem Gelir Projeksiyonu aynı kod
   yolunu paylaştığı için ikisinde de otomatik çalışır. 24 ay/%15 senaryosuyla
   gerçek PDF üretilip satırın doğru bastığı doğrulandı.

## Tarımsal Ürün Gelir Hesabı — tam yeniden inşa

- **Seçim kapısı:** Ekili / Dikili / Karma seçilmeden alt veriler görünmez
  (landing sayfasıyla BİREBİR aynı `.choice` bileşeni kullanılarak — görsel
  dil otomatik tutarlı).
- **Ada/parsel opsiyonel:** elle yazılabilir, zorunlu değil; KML yüklenirse
  mahalle/ada/parsel VE alan otomatik doldurur ama dayatmaz, hepsi üzerine
  yazılabilir.
- **Ekilebilir Alan:** varsayılan %100; oran ↔ m² çift yönlü bağlı (biri
  değişince diğeri güncellenir).
- **"Diğer" ürün:** listede olmayan ürün serbestçe yazılabilir (örn. Ispanak).
- **Yan Ürün (opsiyonel, tıklayınca açılır, yalnız Ekili satırlarında):**
  buğday→saman, arpa→saman, ayçiçeği→küspe, pamuk→çiğit küspesi — online
  denetimli güncel fiyatlarla (kaynak notlu), "Diğer" seçeneğiyle serbest de
  yazılabilir. Aynı alan/dönüm üzerinden hesaplanır, ana ürünün net gelirine
  eklenir (Şekerbank örnek Excel'iyle kuruşuna doğrulandı: buğday 939.676 TL
  + saman 217.896 TL formülü ayrı ayrı test edilip birebir tuttu).
- **Dikili (Ağaç):** ağaç sayısı doğrudan girilir, ürün seçilince hesap
  başlar; dikim aralığı yalnız opsiyonel yardımcı araçtır (4×4→625 gibi
  öneri verir, zorunlu değil). "➕ Farklı Ağaç Ekle" ile çoklu ağaç türü.
  Opsiyonel Alan m² alanı: doldurulursa yoğunluk kontrolü yapılır (m² başına
  1 ağaçtan fazlaysa uyarır, engellemez) ve Karma'daki kalan-alan hesabına
  girer.
- **Karma:** Ekili + Dikili satırlar birlikte; "Kalan Alan" göstergesi
  (parsel ekilebilir alanı − ekili ayrılan − dikili ayrılan, yalnız alanı
  girilmiş dikili satırlar sayılır).
- **Amorti yılı:** varsayılan **25**, her zaman değiştirilebilir.
- **Değer:** yıllık net gelir × amorti yılı, **en yakın 5.000 TL'nin katına**
  yuvarlanır. Klişe "nihai takdir uzmana aittir" cümlesi kaldırıldı.
- **PDF + Excel indirme (YENİ — önceden hiç yoktu):** İkisi de kurumsal
  başlık/renk paletini (NAVY/GOLD, Dora logosu) mevcut Arsa modülüyle
  BİREBİR paylaşıyor — ayrı bir görsel dil icat edilmedi. Ada/parsel/KML
  bilgisi varsa gösterilir, yoksa da belge sorunsuz üretilir. Karma modda
  Ekili ve Dikili ürünler PDF/Excel'de AYRI iki liste halinde. Excel banka/
  kurumsal alıcıya iletilebilir kalitede (ExcelJS, aynı export/excel.ts
  deseni). Her ikisi de gerçek verilerle üretilip içerikleri satır satır
  doğrulandı.
- **8 yeni golden test:** ağaç aralığı, Şekerbank formülü doğrulaması, yan
  ürün hesabı, yoğunluk uyarısı, Karma kalan-alan, 5.000 TL yuvarlama, alan
  aşım uyarısı.

## Genel tutarlılık

- "← Yöntem Seçimi" → **"← Ana Sayfaya Dön"**, tüm modüllerde (Arsa/Otel/
  Tarım/Akaryakıt) tutarlı.

## Bu paketin KAPSAMADIĞI (dürüst sınır)

- **Akaryakıt modülünün otomasyon-Excel okuma ve sayfa düzeni yeniden
  tasarımı** — Salih'in "tek tek inceleyip döneceğim" dediği ve henüz
  iletilmediği için dokunulmadı. Buton adı ve genel stil tutarlılığı hariç,
  Akaryakıt'ın iç mantığı bir önceki haliyle duruyor.
- Genel stil denetimi Tarım+PDF/Excel odaklıydı; diğer ekranlarda (Otel,
  İşletme) küçük tutarsızlıklar kalmış olabilir — göze çarpan olursa
  bildirin, ayrı bir turda toplu taranır.

## Yükleme
GitHub → ArsaPlan → Add file → Upload files → zip içindeki `src`, `public`,
`package.json` dosyalarını sürükleyip bırak → Commit → Actions'ın yeşile
dönmesini bekleyin.
