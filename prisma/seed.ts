import { PrismaClient } from "@prisma/client";
import { FRAGENKATALOG } from "./seed-data/fragenkatalog";

const prisma = new PrismaClient();

async function main() {
  console.log(`Seede ${FRAGENKATALOG.length} Fragen aus dem Fragenkatalog …`);

  for (const q of FRAGENKATALOG) {
    await prisma.question.upsert({
      where: { id: q.id },
      create: {
        id: q.id,
        chapter: q.chapter,
        chapterTitle: q.chapterTitle,
        question: q.question,
        answer: q.answer,
        sourceRef: q.sourceRef,
        mcqOptions: q.mcqOptions ?? null,
        confidence: q.confidence ?? null,
      },
      update: {
        chapter: q.chapter,
        chapterTitle: q.chapterTitle,
        question: q.question,
        answer: q.answer,
        sourceRef: q.sourceRef,
        mcqOptions: q.mcqOptions ?? null,
        confidence: q.confidence ?? null,
      },
    });
  }

  const count = await prisma.question.count();
  console.log(`Seed abgeschlossen. ${count} Fragen in der Datenbank.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });