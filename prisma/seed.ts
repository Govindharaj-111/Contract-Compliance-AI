import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const seedFile = path.join(__dirname, 'seed-data.json');
  if (!fs.existsSync(seedFile)) {
    console.log('No seed-data.json found. Skipping seed.');
    return;
  }

  const rawData = fs.readFileSync(seedFile, 'utf8');
  const data = JSON.parse(rawData);

  console.log('Starting database seeding to PostgreSQL...');

  // 1. Seed Policies
  if (Array.isArray(data.policies)) {
    for (const policy of data.policies) {
      await prisma.policy.upsert({
        where: { code: policy.code },
        update: {
          title: policy.title,
          category: policy.category,
          content: policy.content,
          isActive: policy.isActive ?? true,
          version: policy.version || '1.0',
        },
        create: {
          id: policy.id,
          title: policy.title,
          code: policy.code,
          category: policy.category,
          content: policy.content,
          isActive: policy.isActive ?? true,
          version: policy.version || '1.0',
          requirements: policy.requirements?.length
            ? {
                create: policy.requirements.map((r: { id?: string; requirement: string; category?: string | null; clauseCode?: string | null }) => ({
                  id: r.id,
                  requirement: r.requirement,
                  category: r.category,
                  clauseCode: r.clauseCode,
                })),
              }
            : undefined,
        },
      });
    }
    console.log(`Seeded ${data.policies.length} policies.`);
  }

  // 2. Seed Contracts
  if (Array.isArray(data.contracts)) {
    for (const c of data.contracts) {
      const existing = await prisma.contract.findUnique({ where: { id: c.id } });
      if (!existing) {
        await prisma.contract.create({
          data: {
            id: c.id,
            title: c.title,
            fileName: c.fileName,
            fileUrl: c.fileUrl,
            fileSize: c.fileSize,
            mimeType: c.mimeType,
            pageCount: c.pageCount ?? 0,
            status: c.status || 'PENDING_ANALYSIS',
            extractedText: c.extractedText,
            pages: c.pages?.length
              ? {
                  create: c.pages.map((p: { id?: string; pageNumber: number; sectionTitle?: string | null; textContent: string }) => ({
                    id: p.id,
                    pageNumber: p.pageNumber,
                    sectionTitle: p.sectionTitle,
                    textContent: p.textContent,
                  })),
                }
              : undefined,
            obligations: c.obligations?.length
              ? {
                  create: c.obligations.map((o: { id?: string; title: string; description: string; category: string; responsibleParty?: string | null; deadlineText?: string | null; noticePeriod?: string | null; slaRequirement?: string | null; dataHandlingRequirement?: string | null; confidence?: number | null; status?: string; severity?: string; pageNumber?: number | null; clauseNumber?: string | null; evidenceText?: string | null }) => ({
                    id: o.id,
                    title: o.title,
                    description: o.description,
                    category: o.category,
                    responsibleParty: o.responsibleParty,
                    deadlineText: o.deadlineText,
                    noticePeriod: o.noticePeriod,
                    slaRequirement: o.slaRequirement,
                    dataHandlingRequirement: o.dataHandlingRequirement,
                    confidence: o.confidence ?? 1.0,
                    status: o.status || 'PENDING',
                    severity: o.severity || 'MEDIUM',
                    pageNumber: o.pageNumber,
                    clauseNumber: o.clauseNumber,
                    evidenceText: o.evidenceText,
                  })),
                }
              : undefined,
            deadlines: c.deadlines?.length
              ? {
                  create: c.deadlines.map((d: { id?: string; obligationId?: string | null; title: string; description?: string | null; dueDate?: string | null; deadlineText?: string | null; noticeDays?: number; noticePeriodText?: string | null; responsibleParty?: string | null; status?: string; severity?: string; confidence?: number | null; pageNumber?: number | null; clauseNumber?: string | null; evidenceText?: string | null; isAlertSent?: boolean }) => ({
                    id: d.id,
                    obligationId: d.obligationId,
                    title: d.title,
                    description: d.description,
                    dueDate: d.dueDate ? new Date(d.dueDate) : null,
                    deadlineText: d.deadlineText,
                    noticeDays: d.noticeDays ?? 30,
                    noticePeriodText: d.noticePeriodText,
                    responsibleParty: d.responsibleParty,
                    status: d.status || 'UPCOMING',
                    severity: d.severity || 'MEDIUM',
                    confidence: d.confidence ?? 1.0,
                    pageNumber: d.pageNumber,
                    clauseNumber: d.clauseNumber,
                    evidenceText: d.evidenceText,
                    isAlertSent: d.isAlertSent ?? false,
                  })),
                }
              : undefined,
          },
        });
      }
    }
    console.log(`Seeded ${data.contracts.length} contracts.`);
  }

  // 3. Seed Conversations & Messages
  if (Array.isArray(data.conversations)) {
    for (const conv of data.conversations) {
      const existing = await prisma.conversation.findUnique({ where: { id: conv.id } });
      if (!existing) {
        await prisma.conversation.create({
          data: {
            id: conv.id,
            title: conv.title,
            createdAt: conv.createdAt ? new Date(conv.createdAt) : undefined,
            updatedAt: conv.updatedAt ? new Date(conv.updatedAt) : undefined,
            messages: conv.messages?.length
              ? {
                  create: conv.messages.map((m: { id?: string; role: string; content: string; confidence?: number | null; needsReview?: boolean; sourcesJson?: string | null; createdAt?: string }) => ({
                    id: m.id,
                    role: m.role,
                    content: m.content,
                    confidence: m.confidence,
                    needsReview: m.needsReview ?? false,
                    sourcesJson: m.sourcesJson,
                    createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
                  })),
                }
              : undefined,
          },
        });
      }
    }
    console.log(`Seeded ${data.conversations.length} conversations.`);
  }

  console.log('Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
