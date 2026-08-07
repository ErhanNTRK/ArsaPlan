/**
 * ZİRAAT BANKASI TABLOSU İNDİR — Maliyet Yaklaşımı modülüne özel.
 *
 * Erhan Öntürk'ün ilettiği gerçek Ziraat Bankası "Değerleme Detay Tablosu"
 * şablonu (ziraatTemplate.ts, base64 gömülü) ExcelJS ile yüklenir; yalnız
 * NİTELİKLİ GAYRİMENKUL sayfasındaki girdi hücreleri doldurulur. Şablonun
 * kendi formülleri (=E3*F3, =E4*F4*G4, =SUM(...)) DOKUNULMADAN kalır —
 * banka dosyayı açtığında canlı, yeniden hesaplanabilir bir tablo görür.
 *
 * TARLA / ARSA / KONUT-İŞYERLERİ sayfaları bilinçli olarak boş/orijinal
 * bırakılır (kapsam dışı — Erhan'ın kararı). Dora logosu eklenmez.
 *
 * Eşleme (kilitli, Erhan ile netleştirildi):
 *  - E3/F3 (Arsa Alanı/Birim Değeri)      ← Maliyet Yaklaşımı: netParcelArea / landUnitValue
 *  - C4, C5...  (Gayrimenkul Adı)          ← yapı satırının "type" alanı (kullanıcı adı)
 *  - E4, E5...  (Alan)                     ← yapı satırının area'sı
 *  - F4, F5...  (Birim Değer)              ← yapı satırının effectiveUnitCost'u (override dahil)
 *  - G4, G5...  (Yıpranma Payı)            ← yapı satırının depreciationPct'i ÷ 100 (dönüştürme YOK)
 *  - Şerefiye/Düzeltme satırı (sabit H)    ← adjustmentValue (formül değil, sabit değer — şablonun kendi yapısı böyle)
 *  - B sütunu (Gayrimenkul Sıra No)        ← boş bırakılır
 *  - I sütunu (Satış Kabiliyeti)           ← sabit "SATILABİLİR"
 *  - 5.000'e yuvarlama                     ← bu export'ta UYGULANMAZ (şablonun kendi SUM'u ham toplamı verir)
 *  - Yasal Durum tablosu (satır 1-6)       ← result.buildingRows (Yasal Durum = ana Maliyet Yaklaşımı girişi)
 *  - Mevcut Durum tablosu (satır 8-13)     ← result.current.buildingRows (opsiyon kapalıysa Yasal ile aynı)
 */
import ExcelJS from 'exceljs';
import { triggerDownload } from '../export/excel';
import { ZIRAAT_TEMPLATE_B64 } from './ziraatTemplate';
import type { CostApproachInput, CostApproachResult, CostBuildingRowResult } from './engine';

const SHEET_NAME = 'NİTELİKLİ GAYRİMENKUL';

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/**
 * Şablonun sabit 2 satırlık iskeletini (Arsa + 1 Yapı) gerektiği kadar yapı
 * satırıyla genişletir. Yeni satırlar, mevcut YAPI satırının (row 4) stilini
 * kopyalayarak eklenir; SUM formülü de genişletilen aralığı kapsayacak
 * şekilde güncellenir.
 */
function fillStatusTable(
  ws: ExcelJS.Worksheet,
  startRow: number, // 3 (Yasal) ya da 10 (Mevcut) — ARSA satırı
  landArea: number,
  landUnitValue: number,
  buildings: CostBuildingRowResult[],
  adjustmentValue: number,
) {
  const arsaRow = startRow;
  const firstBuildingRow = startRow + 1;

  // ARSA satırı — E/F girilir. H formülünü (=E*F) BİLİNÇLİ OLARAK burada yeniden yazıyoruz:
  // Yasal Durum bloğuna satır eklendiğinde (spliceRows), Mevcut Durum bloğu aşağı kayar ama
  // ExcelJS satır kaydırırken formül İÇİNDEKİ hücre referanslarını GÜNCELLEMEZ — şablonun
  // orijinal "=E10*F10" gibi bir formülü, satır 12'ye kaysa bile hâlâ eski satır 10'a bakar
  // (o satırda artık başlık metni olduğu için sonuç 0 çıkar). Bu yüzden formülü her zaman
  // güncel satır numarasıyla yeniden yazıyoruz.
  ws.getCell(`E${arsaRow}`).value = landArea || null;
  ws.getCell(`F${arsaRow}`).value = landUnitValue || null;
  ws.getCell(`H${arsaRow}`).value = { formula: `E${arsaRow}*F${arsaRow}` };
  ws.getCell(`B${arsaRow}`).value = null; // şablonun örnek "102/6" ada/parsel metni — boş bırakılır
  ws.getCell(`D${arsaRow}`).value = null;

  // Gerekli yapı satırı sayısı kadar, ilk yapı satırının (firstBuildingRow) stilini kopyalayarak satır ekle.
  const templateRow = ws.getRow(firstBuildingRow);
  const extraNeeded = Math.max(0, buildings.length - 1);
  if (extraNeeded > 0) {
    ws.spliceRows(firstBuildingRow + 1, 0, ...Array(extraNeeded).fill([]));
    for (let i = 0; i < extraNeeded; i++) {
      const targetRow = ws.getRow(firstBuildingRow + 1 + i);
      templateRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const t = targetRow.getCell(colNumber);
        t.style = { ...cell.style };
      });
      targetRow.height = templateRow.height;
    }
  }

  const lastBuildingRow = firstBuildingRow + Math.max(0, buildings.length - 1);
  const adjustmentRow = lastBuildingRow + 1;
  const totalRow = adjustmentRow + 1;

  buildings.forEach((b, i) => {
    const r = firstBuildingRow + i;
    ws.getCell(`A${r}`).value = i + 2; // Sıra No: Arsa=1, yapılar 2,3,4...
    ws.getCell(`B${r}`).value = null; // Gayrimenkul Sıra No (ada/parsel) — boş
    ws.getCell(`C${r}`).value = b.type || `Yapı ${i + 1}`;
    ws.getCell(`D${r}`).value = null; // Yapı Ruhsatı — şablonun örnek metnini taşımıyoruz, veri yok
    ws.getCell(`E${r}`).value = b.area || null;
    ws.getCell(`F${r}`).value = b.effectiveUnitCost || null;
    ws.getCell(`G${r}`).value = b.depreciationPct != null ? b.depreciationPct / 100 : null;
    ws.getCell(`H${r}`).value = { formula: `E${r}*F${r}*G${r}` };
    ws.getCell(`I${r}`).value = null;
  });

  // Şerefiye/Düzeltme/Çevre Düzenlemesi satırı — şablonda formül değil, sabit değer.
  ws.getCell(`C${adjustmentRow}`).value = 'ÇEVRE DÜZENLEME/ŞEREFİYE/DÜZELTME';
  ws.getCell(`H${adjustmentRow}`).value = adjustmentValue || 0;

  // Genel Toplam — şablonun kendi SUM mantığı: alan toplamı yalnız yapılar, değer toplamı Arsa+Yapılar+Düzeltme.
  ws.getCell(`A${totalRow}`).value = 'GENEL TOPLAM';
  ws.getCell(`E${totalRow}`).value = { formula: `SUM(E${firstBuildingRow}:E${lastBuildingRow})` };
  ws.getCell(`H${totalRow}`).value = { formula: `SUM(H${arsaRow}:H${adjustmentRow})` };
  ws.getCell(`I${totalRow}`).value = 'SATILABİLİR';

  // Arsa ve tüm yapı satırlarında Satış Kabiliyeti sabit "SATILABİLİR".
  ws.getCell(`I${arsaRow}`).value = 'SATILABİLİR';

  return { firstBuildingRow, lastBuildingRow, adjustmentRow, totalRow };
}

export async function buildZiraatWorkbook(input: CostApproachInput, r: CostApproachResult): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(base64ToArrayBuffer(ZIRAAT_TEMPLATE_B64));

  const ws = wb.getWorksheet(SHEET_NAME);
  if (!ws) throw new Error(`Şablonda "${SHEET_NAME}" sayfası bulunamadı.`);

  const landArea = input.netParcelArea ?? 0;
  const landUnitValue = input.landUnitValue ?? 0;

  // Yasal Durum — şablonun sabit satır 3'ünden (ARSA) başlıyor.
  const legal = fillStatusTable(ws, 3, landArea, landUnitValue, r.buildingRows, r.adjustmentValue);

  // Mevcut Durum bloğu, Yasal Durum bloğunun eklenen satırlarından SONRA kayar.
  // Şablonda orijinal olarak satır 8 (başlık) / 9 (kolon başlıkları) / 10 (ARSA) idi;
  // Yasal Durum'a N satır eklendiyse Mevcut Durum bloğu da o kadar aşağı kaymış olur.
  const insertedInLegal = legal.totalRow - 6; // orijinal Yasal Durum GENEL TOPLAM satırı 6 idi
  const mevcutArsaRow = 10 + insertedInLegal;
  const mevcutBuildings = r.current.buildingRows.length > 0 ? r.current.buildingRows : r.buildingRows;
  const mevcutAdjustment = r.current.buildingRows.length > 0 ? r.current.adjustmentValue : r.adjustmentValue;
  fillStatusTable(ws, mevcutArsaRow, landArea, landUnitValue, mevcutBuildings, mevcutAdjustment);

  return wb;
}

export async function downloadCostApproachZiraatExcel(input: CostApproachInput, r: CostApproachResult) {
  const wb = await buildZiraatWorkbook(input, r);
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerDownload(blob, `Ziraat-Tablosu-${(input.category || 'rapor').replace(/\s+/g, '-')}.xlsx`);
}
