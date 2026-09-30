import { prisma } from './prisma';

export async function seedDatabase() {
  console.log('Seeding database with default corporate compliance policies...');

  const policies = [
    {
      code: 'POL-SEC-001',
      title: 'Data Encryption & Security Standard',
      category: 'Security',
      version: '1.5',
      content: 'All confidential customer records and PII must be encrypted using AES-256 at rest and TLS 1.3 in transit. Multi-Factor Authentication (MFA) must be enforced for administrative access.',
      requirements: [
        { requirement: 'AES-256 encryption mandatory for all stored customer data.', category: 'Security', clauseCode: 'POL-SEC-001-A' },
        { requirement: 'TLS 1.3 mandatory for data in transit.', category: 'Security', clauseCode: 'POL-SEC-001-B' },
      ],
    },
    {
      code: 'POL-PRIV-001',
      title: 'Data Retention & Erasure Policy',
      category: 'Data Privacy',
      version: '1.0',
      content: 'Customer data and personal information must be permanently purged within 90 days following agreement termination or explicit written erasure request under GDPR/CCPA compliance.',
      requirements: [
        { requirement: 'Permanent deletion of customer data within 90 days of contract termination.', category: 'Data Privacy', clauseCode: 'POL-PRIV-001-A' },
      ],
    },
    {
      code: 'POL-SLA-001',
      title: 'Platform Availability & Uptime SLA Policy',
      category: 'SLA',
      version: '2.1',
      content: 'SaaS platforms and managed services must guarantee a minimum monthly SLA availability of 99.9% uptime (excluding scheduled maintenance) with credit remedies for downtime breaches.',
      requirements: [
        { requirement: 'Minimum 99.9% monthly availability SLA requirement.', category: 'SLA', clauseCode: 'POL-SLA-001-A' },
      ],
    },
    {
      code: 'POL-NOT-001',
      title: 'Contract Renewal & Termination Notice Window',
      category: 'Notice & Term',
      version: '1.2',
      content: 'Agreement termination or non-renewal notices must be submitted in writing at least 60 days prior to the expiration of the active term to prevent automatic renewal.',
      requirements: [
        { requirement: 'Written non-renewal notice window of at least 60 days.', category: 'Notice & Term', clauseCode: 'POL-NOT-001-A' },
      ],
    },
    {
      code: 'POL-FIN-001',
      title: 'Payment Terms & Late Fee Cap Standard',
      category: 'Financial',
      version: '1.0',
      content: 'Standard vendor payment terms are Net 30 days from receipt of a valid invoice. Late payment charges shall not exceed 1.5% per month on overdue balances.',
      requirements: [
        { requirement: 'Payment terms Net 30 days; late fee capped at 1.5% monthly.', category: 'Financial', clauseCode: 'POL-FIN-001-A' },
      ],
    },
  ];

  for (const pol of policies) {
    const existing = await prisma.policy.findUnique({
      where: { code: pol.code },
    });

    if (!existing) {
      await prisma.policy.create({
        data: {
          code: pol.code,
          title: pol.title,
          category: pol.category,
          version: pol.version,
          content: pol.content,
          requirements: {
            create: pol.requirements,
          },
        },
      });
      console.log(`Created policy ${pol.code}: ${pol.title}`);
    } else {
      console.log(`Policy ${pol.code} already exists.`);
    }
  }

  console.log('Database seeding complete!');
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
