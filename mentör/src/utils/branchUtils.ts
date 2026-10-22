/**
 * Checks if a subject is allowed for a given student branch.
 * Rules:
 * - Sayısal (MF): ONLY TYT Türkçe, TYT/AYT Matematik, TYT/AYT Geometri, TYT/AYT Fizik, Kimya, Biyoloji.
 *   (Strictly NO Sözel/TM subjects like Tarih, Coğrafya, Felsefe, Din, Edebiyat)
 * - Eşit Ağırlık (TM): ALL subjects EXCEPT TYT & AYT Fizik, Kimya, Biyoloji (Fen Bilimleri).
 */
export function isSubjectAllowedForBranch(rawSubject: string, branch?: string): boolean {
  if (!branch) return true;

  const bLower = branch.toLowerCase().trim();
  const isSayisal = bLower.includes('sayısal') || bLower.includes('mf');
  const isEsitAgirlik = bLower.includes('eşit ağırlık') || bLower.includes('tm');

  // If branch is neither explicit Sayısal nor Eşit Ağırlık (e.g., Ortak / Tüm), allow all
  if (!isSayisal && !isEsitAgirlik) return true;

  const subjectName = rawSubject.trim();
  const upper = subjectName.toUpperCase();

  const isFen = upper.includes('FİZİK') || upper.includes('FIZIK') || 
                upper.includes('KİMYA') || upper.includes('KIMYA') || 
                upper.includes('BİYOLOJİ') || upper.includes('BIYOLOJI');

  const isSozel = upper.includes('TARİH') || upper.includes('COĞRAFYA') || upper.includes('COGRAFYA') ||
                  upper.includes('FELSEFE') || upper.includes('DİN') || upper.includes('DIN') || 
                  upper.includes('EDEBİYAT') || upper.includes('EDEBIYAT') || upper.includes('TÜRK DİLİ');

  if (isSayisal) {
    // Sayısal (MF): Sözel/TM subjects are excluded
    if (isSozel) return false;
    return true;
  }

  if (isEsitAgirlik) {
    // Eşit Ağırlık (TM): Fen subjects (Fizik, Kimya, Biyoloji) are excluded
    if (isFen) return false;
    return true;
  }

  return true;
}
