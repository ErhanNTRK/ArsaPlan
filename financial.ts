/**
 * UZMAN YORUM MOTORU (kural bazlı)
 * Sunucusuz, çevrimdışı, deterministik: aynı girdi her zaman aynı yorumu üretir.
 */
import type {
  Advice, CapacityResult, FinancialResult, ShareResult,
  Parcel, Zoning, VillaConfig, EmsalOptions, CostInput, SiteWorks, ResidualInput,
} from './types';

const pct = (v: number, d = 0) => `%${(v * 100).toFixed(d)}`;
const m2 = (v: number) => `${Math.round(v).toLocaleString('tr-TR')} m²`;
const tl = (v: number) => `${Math.round(v).toLocaleString('tr-TR')} ₺`;

export function buildAdvice(
  parcel: Parcel, zoning: Zoning, villa: VillaConfig, emsal: EmsalOptions,
  cost: CostInput, site: SiteWorks, residual: ResidualInput,
  capacity: CapacityResult, financial: FinancialResult, share: ShareResult,
  shareEnabled: boolean,
): Advice[] {
  const out: Advice[] = [];
  const add = (level: Advice['level'], title: string, body: string) => out.push({ level, title, body });

  capacity.warnings.forEach((w) => add('uyari', 'Kapasite uyarısı', w));

  /* ── Yöntem notu ── */
  if (zoning.mode === 'dogrudan') {
    add('bilgi', 'Doğrudan alan girişi kullanılıyor',
      'Kapasite, TAKS/KAKS yerine doğrudan girdiğiniz taban oturumu ve toplam inşaat alanı üzerinden kuruldu. ' +
      'Bu değerlerin plan notu, avan proje veya kütle etüdüyle uyumlu olduğundan emin olunuz; model bunları doğrulayamaz.');
  }

  /* ── Bağlayıcı kısıt ── */
  if (capacity.unitCount > 0) {
    if (capacity.binding === 'TAKS' || capacity.binding === 'DOĞRUDAN TABAN') {
      add('bilgi', 'Projeyi taban alanı sınırlıyor',
        `Kullanılabilir taban ${m2(capacity.effectiveFootprint)} ile sınırlı. ` +
        (capacity.emsalUsage != null && capacity.emsalUsage < 0.85
          ? `Emsal hakkının yalnızca ${pct(capacity.emsalUsage)}'i kullanılıyor — villa kat adedini artırmak (aynı tabanda daha fazla alan) emsali değerlendirmenin en doğrudan yoludur.`
          : 'Emsal hakkı da büyük ölçüde kullanılıyor; proje imar haklarını verimli değerlendiriyor.'));
    } else if (capacity.binding === 'KAKS' || capacity.binding === 'DOĞRUDAN İNŞAAT ALANI') {
      add('bilgi', 'Projeyi toplam inşaat alanı sınırlıyor',
        `İnşaat hakkı ${m2(capacity.kaksLimit ?? 0)} ile sınırlı ve tamamına yakını kullanılıyor. ` +
        'Taban alanında yer kalsa bile toplam alan artırılamaz; bu noktadan sonra değeri artıran tek şey ürün kalitesi ve satış fiyatıdır.');
    } else if (capacity.binding === 'ÇEKME MESAFESİ') {
      add('dikkat', 'Projeyi çekme mesafeleri sınırlıyor',
        `Yapılaşma zarfı ${capacity.envelope.buildableWidth.toFixed(1)} m × ${capacity.envelope.buildableDepth.toFixed(1)} m = ${m2(capacity.envelope.envelopeArea)} ` +
        `(parselin ${pct(capacity.envelope.envelopeRatio)}'i). Yerleşim verimliliği ${pct(villa.layoutEfficiency)} uygulandığında fiili taban ${m2(capacity.layoutFootprint)} kalıyor. ` +
        (capacity.taksLimit != null && capacity.layoutFootprint < capacity.taksLimit
          ? `İmar ${m2(capacity.taksLimit)} tabana izin vermesine rağmen çekmeler bunu ${m2(capacity.taksLimit - capacity.layoutFootprint)} kısıtlıyor. İkiz veya sıralı villa düzeni bu kaybı azaltır.`
          : 'İmar hakları zaten zarfın altında kaldığı için ek kayıp yok.'));
    }
  }

  /* ── Villa kurgusu ── */
  if (villa.mode === 'adet' && capacity.unitCount > 0) {
    add('bilgi', 'Villa adedi elle belirlendi',
      `${capacity.unitCount} villa girildi; kapasite bu adede bölünerek villa başına ${m2(capacity.grossPerVilla)} zemin üstü brüt alan hesaplandı ` +
      `(taban ${m2(capacity.footprintPerUnit)} × ${villa.floorsPerVilla} kat). Villa büyüklüğü hedefinizin altındaysa adedi azaltınız.`);
  }

  /* ── Villa–parsel ölçeği ── */
  if (capacity.unitCount > 0) {
    const landPerUnit = parcel.area / capacity.unitCount;
    if (landPerUnit < 250) {
      add('dikkat', 'Villa başına arsa payı düşük',
        `Villa başına ${Math.round(landPerUnit)} m² arsa düşüyor. Müstakil villa alıcısının beklentisi genellikle 300 m² üzeridir; ` +
        'bu yoğunlukta ürün "bahçe dubleksi" algısı yaratır ve hedeflenen m² fiyatına ulaşmak zorlaşır.');
    } else if (landPerUnit > 900) {
      add('bilgi', 'Villa başına arsa payı yüksek',
        `Villa başına ${Math.round(landPerUnit)} m² arsa düşüyor — prestijli ürün için avantaj. ` +
        'İmar hakkı tam kullanılmıyorsa villa sayısını veya büyüklüğünü artırmak toplam değeri yükseltebilir.');
    } else {
      add('olumlu', 'Villa–parsel ölçeği dengeli',
        `Villa başına ${Math.round(landPerUnit)} m² arsa payı, müstakil villa ürünü için makul aralıktadır.`);
    }
    if (capacity.envelope.hasGeometry) {
      const side = Math.sqrt(capacity.footprintPerUnit);
      if (side > capacity.envelope.buildableWidth) {
        add('uyari', 'Villa tabanı zarfa sığmıyor olabilir',
          `Villa taban alanı ${m2(capacity.footprintPerUnit)} (~${side.toFixed(1)} m × ${side.toFixed(1)} m), zarf genişliği ise ${capacity.envelope.buildableWidth.toFixed(1)} m. ` +
          'Kat adedini artırıp tabanı küçültmek gerekebilir.');
      }
    }
  }

  /* ── Bodrum ── */
  if (emsal.hasBasement) {
    if (emsal.basementInEmsal) {
      add('dikkat', 'Bodrum emsale dahil — kapasite kaybı var',
        `Bodrum katlar (${m2(capacity.basementArea)}) emsale sayıldığı için zemin üstü hakkınızdan aynı miktarda düşüyor. ` +
        'Plan notunuz izin veriyorsa (tamamen toprak altında kalan, iskân edilmeyen kısımlar için çoğu planda mümkündür) bodrumu emsal dışına almak, ' +
        'aynı arsada daha fazla satılabilir alan üretmenin en düşük maliyetli yoludur.');
    } else {
      add('olumlu', 'Bodrum emsal dışı — doğru kurgu',
        `Bodrum (${m2(capacity.basementArea)}) emsal dışında; emsal hakkı tamamen zemin üstü satılabilir alana ayrılmış. ` +
        `Not: bodrum emsale girmese de maliyete giriyor — modelde ${tl(financial.basementCost)} olarak hesaplandı.`);
    }
  } else {
    add('bilgi', 'Bodrum öngörülmemiş',
      'Bodrum yok; maliyet düşük ancak otopark, depo ve teknik hacimler zemin üstünde çözülmek zorunda. ' +
      'Eğimli parsellerde bodrum çoğu kez düşük maliyetle kazanılan alandır — parsel eğimliyse yeniden değerlendirilmelidir.');
  }

  /* ── Çatı arası ── */
  if (emsal.hasAttic) {
    if (emsal.atticInEmsal) {
      add('dikkat', 'Çatı arası emsale dahil',
        `Çatı arası piyesleri (${m2(capacity.atticArea)}) emsale sayılıyor. Plan notunda "son kat ile irtibatlı, bağımsız bölüm oluşturmayan çatı arası piyesi" ` +
        'ifadesi varsa çoğu belediyede emsal dışı kabul edilir; bu ayrım villa başına ' + m2(capacity.atticArea / Math.max(1, capacity.unitCount)) + ' fark yaratıyor.');
    } else {
      add('olumlu', 'Çatı arası emsal dışı — satılabilir alan kazancı',
        `Çatı arası piyesleri (${m2(capacity.atticArea)}) emsal dışında tutulmuş ve satılabilir alana eklenmiş. ` +
        'Villa ürününde çatı arası, m² fiyatını düşürmeden hacim algısı yarattığı için satışa doğrudan katkı verir.');
    }
  }

  /* ── Peyzaj / bahçe ── */
  if (capacity.gardenArea > 0 && capacity.unitCount > 0) {
    const gardenPerUnit = capacity.gardenArea / capacity.unitCount;
    add(financial.gardenRevenue > 0 ? 'olumlu' : 'bilgi',
      'Bahçe ve peyzaj',
      `Villa başına yaklaşık ${m2(gardenPerUnit)} bahçe düşüyor; peyzaj maliyeti ${tl(financial.landscapeCost)} olarak hesaplandı. ` +
      (financial.gardenRevenue > 0
        ? `Bahçe ayrıca fiyatlandığı için hasılata ${tl(financial.gardenRevenue)} katkı veriyor.`
        : 'Bahçe ayrıca fiyatlanmadı; değeri villa m² fiyatının içinde kabul edildi. Geniş bahçeli villalarda bahçeyi ayrı fiyatlamak hasılatı daha gerçekçi gösterir.'));
  }

  /* ── Maliyet varsayımı ── */
  if (cost.inflationRate === 0) {
    add('dikkat', 'Birim maliyet güncellenmemiş',
      `Bakanlık tebliğ değeri (${tl(cost.unitCost)}/m²) doğrudan kullanılıyor. Tebliğ rakamları resmî işlemler içindir; ` +
      'piyasa maliyetleri genellikle üzerindedir. Gerçekçi fizibilite için güncelleme oranı girilmesi önerilir.');
  }
  if (capacity.saleableArea > 0) {
    const ratio = financial.costPerSaleableM2 / Math.max(1, financial.revenue / capacity.saleableArea);
    if (ratio > 0.6) {
      add('uyari', 'Maliyet / satış dengesi zayıf',
        `Satılabilir m² başına toplam maliyet ${tl(financial.costPerSaleableM2)}; satış fiyatının ${pct(ratio)}'ine denk geliyor. ` +
        'Bu oran %60\'ı aştığında arsaya anlamlı değer kalması güçleşir.');
    }
  }

  /* ── Artık değer sağlığı ── */
  if (financial.residualLandValue <= 0) {
    add('uyari', 'Artık arsa değeri negatif',
      'Mevcut varsayımlarla proje arsa bedelini karşılamıyor. Satış fiyatı, yapı sınıfı, kâr oranı veya finansman varsayımlarından ' +
      'en az biri gözden geçirilmelidir. Bu sonuç arsanın değersiz olduğu değil, bu proje kurgusunun fizibl olmadığı anlamına gelir.');
  } else {
    if (financial.landToRevenue < 0.15) {
      add('dikkat', 'Arsa payı düşük',
        `Arsa değeri hasılatın ${pct(financial.landToRevenue, 1)}'ine denk. Konut projelerinde tipik bant %20-35'tir; ` +
        'maliyet veya kâr varsayımları yüksek olabilir.');
    } else if (financial.landToRevenue > 0.40) {
      add('dikkat', 'Arsa payı yüksek',
        `Arsa değeri hasılatın ${pct(financial.landToRevenue, 1)}'ine denk. Çok değerli bir konum ya da iyimser satış fiyatı varsayımı olabilir; ` +
        'emsal satış araştırmasıyla doğrulanması önerilir.');
    } else {
      add('olumlu', 'Arsa payı makul bantta',
        `Arsa değeri hasılatın ${pct(financial.landToRevenue, 1)}'ine denk — sektörde kabul gören %20-35 bandında.`);
    }
    add(financial.safetyMargin < 0.10 ? 'uyari' : financial.safetyMargin < 0.20 ? 'dikkat' : 'olumlu',
      'Fiyat düşüşüne dayanım',
      `Satış fiyatları ${pct(financial.safetyMargin, 1)} düşerse artık arsa değeri sıfırlanır. ` +
      (financial.safetyMargin < 0.10 ? 'Bu çok dar bir emniyet payıdır; küçük bir dalgalanma projeyi zarara çevirir.'
        : financial.safetyMargin < 0.20 ? 'Emniyet payı sınırlı; satış fiyatı temkinli seçilmelidir.'
          : 'Proje makul bir piyasa dalgalanmasını kaldırabilir.'));
  }

  /* ── Finansman ── */
  if (residual.financeRateOfCost > 0.20) {
    add('dikkat', 'Finansman yükü ağır',
      `Finansman gideri toplam maliyetin ${pct(residual.financeRateOfCost)}'i olarak alındı (${tl(financial.financeCost)}). ` +
      'Ön satış ile bu kalem doğrudan düşer ve arsaya kalan değer artar.');
  } else if (residual.financeRateOfCost === 0) {
    add('bilgi', 'Finansman gideri hesaba katılmadı',
      'Finansman oranı %0 girildi. Kredi kullanılacaksa bu kalem modellenmelidir; aksi halde arsa değeri olduğundan yüksek çıkar.');
  }

  /* ── Kat karşılığı (kapalıysa yorum üretilmez) ── */
  if (shareEnabled && financial.revenue > 0 && capacity.unitCount > 0) {
    const t = `Artık değer yöntemine göre dengeli arsa payı ${pct(share.balancedShare, 1)}; girilen pay ${pct(share.ownerShare, 1)}.`;
    if (share.verdict === 'arsa-sahibi-lehine') {
      add('dikkat', 'Kat karşılığı oranı arsa sahibi lehine',
        `${t} Bu oranda müteahhide maliyet sonrası ${tl(share.contractorNet)} kalıyor; hedef kâr seviyesinin altındaysa sözleşme müteahhit için cazip değildir.`);
    } else if (share.verdict === 'muteahhit-lehine') {
      add('dikkat', 'Kat karşılığı oranı müteahhit lehine',
        `${t} Arsa sahibi, artık değer yöntemiyle hesaplanan değerinin ${tl(Math.abs(share.difference))} altında pay alıyor. Müzakerede bu fark somut dayanaktır.`);
    } else {
      add('olumlu', 'Kat karşılığı oranı dengeli',
        `${t} İki yöntem birbirini doğruluyor; paylaşım oranı piyasa gerçekliğiyle uyumlu.`);
    }
  }

  /* ── Alternatif senaryo ── */
  if (capacity.unitCount > 0 && capacity.emsalUsage != null && capacity.emsalUsage < 0.80
      && capacity.binding !== 'KAKS' && capacity.binding !== 'DOĞRUDAN İNŞAAT ALANI') {
    add('bilgi', 'Alternatif senaryo önerisi',
      `Emsal hakkının ${m2((capacity.kaksLimit ?? 0) - capacity.emsalArea)} kadarı kullanılmıyor. Villa kat adedini bir artırmak veya ` +
      'ikiz/sıralı düzene geçmek, tabanı büyütmeden bu hakkı değere çevirebilir. Ürün segmenti izin veriyorsa 3-6 katlı apartman senaryosu da karşılaştırılmalıdır.');
  }
  if (site.landscapeUnitCost === 0 && capacity.gardenArea > 200) {
    add('dikkat', 'Peyzaj maliyeti sıfır girilmiş',
      `${m2(capacity.gardenArea)} açık alan var ancak peyzaj birim maliyeti girilmemiş. Villa projelerinde çevre düzenlemesi ` +
      'satılabilirliği doğrudan etkiler ve göz ardı edilirse maliyet olduğundan düşük çıkar.');
  }

  return out;
}
