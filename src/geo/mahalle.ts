/**
 * Mahalle adına "Mah." / "Mahallesi" son ekini tek seferlik ekler.
 * Kullanıcı adın sonuna zaten "Mah", "Mah." veya "Mahallesi" yazdıysa tekrarlanmaz
 * ("Test Mah" → "Test Mah.", değil "Test Mah Mah.").
 */
export function mahalleAdi(raw: string | null | undefined): string {
  return (raw ?? '').trim().replace(/\s+(mahallesi|mah\.?|mh\.?)$/i, '').trim();
}

export function mahalleKisa(raw: string | null | undefined): string {
  const n = mahalleAdi(raw);
  return n ? `${n} Mah.` : '';
}

export function mahalleUzun(raw: string | null | undefined): string {
  const n = mahalleAdi(raw);
  return n ? `${n} Mahallesi` : '';
}
