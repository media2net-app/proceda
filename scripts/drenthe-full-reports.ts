/**
 * UITGESCHAKELD — geen massa-batch meer.
 *
 * Nieuwe aanpak: per branche (makelaar, horeca, …) alleen de webapp-demo,
 * geen bulk homepage-generatie voor alle Drenthe-bedrijven.
 *
 * Voor één bedrijf (bijv. Schenkel): npx tsx scripts/schenkel-full-report.ts
 */
console.error(
  "[drenthe-full] Gestopt. Geen massa-batch — focus per branche op webapp-demo alleen.",
);
process.exit(0);
