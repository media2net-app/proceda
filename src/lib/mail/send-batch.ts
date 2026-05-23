/** ISO-week batch id voor cohort-analyse, bijv. makelaardij-2026-W22 */
export function buildSendBatchId(branchId: string, at = new Date()): string {
  const d = new Date(
    Date.UTC(at.getFullYear(), at.getMonth(), at.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${branchId}-${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
