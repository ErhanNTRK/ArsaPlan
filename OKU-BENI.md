# ArsaPlan v7.3.0 — Periyodik Bakım Gerçekten Periyodik Oldu

Doğrulama: tsc 0 hata, test 193/193 (yeni golden test dahil), build
başarılı. Periyodik büyüme mantığı iki ayrı testle doğrulandı: (1) eski
"tek tekrar" senaryosunun golden değerleri korundu, (2) yeni "iki
tekrar, ikincisi büyümüş" senaryosu ayrıca doğrulandı.

## "Dönemsel Bakım" → "Periyodik Bakım" — artık gerçekten periyodik

**Eski davranış:** "Yıl"a 5 yazınca yalnız 5. yılda, TEK SEFERLİK
uygulanıyordu — isim "Dönemsel" olsa da davranış tek seferlikti.

**Yeni davranış:** Alan adı **"Periyodik Bakım — Yıl Aralığı"** oldu.
5 yazarsan artık **5, 10, 15, 20... yıllarında tekrar eder.**
**"Periyodik Bakım — Tutar"** kutusuna girdiğin değer **ilk tekrara**
(5. yıl) tam olarak yansır; **sonraki her tekrar (10, 15, 20. yıl)
Gider Artış Oranıyla büyüyerek** uygulanır — tıpkı gelirlerin İNA'yı
büyüyerek etkilemesi gibi, senin de işaret ettiğin mantık.

## Diğer küçük düzeltmeler

- **Yenileme Fonu Oranı** ipucu netleşti: *"Her yıl için hesaplanır —
  %3-5 oranında önerilir."*
- **Sessiz veri kaybı uyarısı** yeni isimle güncellendi: *"Periyodik
  Bakım Tutarı girildi ama Yıl Aralığı boş — bu gider hiçbir yıla
  uygulanmıyor."*

## Yükleme
1. Zip'i çıkar (`src`, `public`, `package.json`, bu dosya görünecek).
2. github.com/ErhanNTRK/ArsaPlan → **Add file → Upload files**.
3. `src` klasörünün **simgesini** (içine girmeden) sürükle-bırak, aynısını
   `public` klasörü ve `package.json` dosyası için de yap.
4. "Üzerine yazılsın mı?" → **evet**.
5. **Commit changes**.
6. **Actions** sekmesinde yeşil tik belirene kadar bekle (~30-60 sn).
7. Siteyi **Ctrl+F5** ile tazele.
