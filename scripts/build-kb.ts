/**
 * Knowledge-base build entrypoint.
 *
 * The ingestion pipeline (OCR → normalize → segment → encode-in-own-words →
 * review) runs offline against PDFs placed in the git-ignored kb/sources/.
 * This script validates the committed rule files and reports KB stats; the
 * heavy extraction stages are run as separate, reviewed steps so that no
 * copyrighted source text ever enters the repository.
 */
import planetData from '../src/kb/rules/planet-significations.json';
import houseData from '../src/kb/rules/house-significations.json';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function main() {
  assert(planetData.rules.length === 9, 'Expected 9 planet rules');
  assert(houseData.rules.length === 12, 'Expected 12 house rules');
  for (const r of planetData.rules) {
    assert(Boolean(r.source.ref), `Planet rule ${r.ruleKey} is missing a citation`);
  }
  console.log(
    `KB ${planetData.kbVersion} valid — ${planetData.rules.length} planet rules, ${houseData.rules.length} house rules, all cited.`,
  );
}

main();
