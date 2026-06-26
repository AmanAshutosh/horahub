import { PrismaClient } from '@prisma/client';
import planetData from '../src/kb/rules/planet-significations.json';
import houseData from '../src/kb/rules/house-significations.json';

const prisma = new PrismaClient();

/** Seed the kb-v1 knowledge-base version from the committed rule files. */
async function main() {
  const version = planetData.kbVersion;
  const kb = await prisma.kbVersion.upsert({
    where: { version },
    update: { published: true },
    create: { version, notes: 'Initial BPHS Ch.3 significations + house significations.', published: true },
  });

  for (const r of planetData.rules) {
    await prisma.kbRule.upsert({
      where: { kbVersionId_ruleKey: { kbVersionId: kb.id, ruleKey: r.ruleKey } },
      update: {},
      create: {
        kbVersionId: kb.id,
        ruleKey: r.ruleKey,
        subject: 'planet',
        conditions: { planet: r.planet },
        reading: r.themes,
        sourceWork: r.source.work,
        sourceRef: r.source.ref,
        tradition: r.source.tradition,
      },
    });
  }

  for (const r of houseData.rules) {
    await prisma.kbRule.upsert({
      where: { kbVersionId_ruleKey: { kbVersionId: kb.id, ruleKey: r.ruleKey } },
      update: {},
      create: {
        kbVersionId: kb.id,
        ruleKey: r.ruleKey,
        subject: 'house',
        conditions: { house: r.house },
        reading: r.themes,
        sourceWork: 'BPHS',
        sourceRef: 'house chapters',
        tradition: 'Parashari',
      },
    });
  }

  console.log(`Seeded ${version}: ${planetData.rules.length} planet + ${houseData.rules.length} house rules.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
