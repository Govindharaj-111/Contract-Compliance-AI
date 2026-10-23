import { prisma } from '../src/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

async function exportData() {
  const contracts = await prisma.contract.findMany({
    include: {
      pages: true,
      obligations: true,
      deadlines: true,
      conflicts: true,
      parties: true,
    },
  });

  const policies = await prisma.policy.findMany({
    include: {
      requirements: true,
      conflicts: true,
    },
  });

  const chatMessages = await prisma.chatMessage.findMany();

  const conversations = await prisma.conversation.findMany({
    include: {
      messages: true,
    },
  });

  const backup = {
    exportedAt: new Date().toISOString(),
    contracts,
    policies,
    chatMessages,
    conversations,
  };

  const outPath = path.join(process.cwd(), 'prisma', 'seed-data.json');
  fs.writeFileSync(outPath, JSON.stringify(backup, null, 2), 'utf8');
  console.log(`Successfully exported SQLite data to ${outPath}`);
  console.log(`- ${contracts.length} contracts`);
  console.log(`- ${policies.length} policies`);
  console.log(`- ${conversations.length} conversations`);
}

exportData()
  .catch((e) => {
    console.error('Export failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
