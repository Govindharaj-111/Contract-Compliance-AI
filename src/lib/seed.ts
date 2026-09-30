import { prisma } from './prisma';

export async function seedDatabase() {
  console.log('Seeding database with default corporate compliance policies and deterministic deadlines...');

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

  // Create Sample Seed Contract if none exists
  let seedContract = await prisma.contract.findFirst({
    where: { title: 'Master Cloud & SaaS Services Agreement 2026' },
  });

  if (!seedContract) {
    seedContract = await prisma.contract.create({
      data: {
        title: 'Master Cloud & SaaS Services Agreement 2026',
        fileName: 'Master_Services_Agreement_2026.pdf',
        fileSize: 1048576,
        mimeType: 'application/pdf',
        pageCount: 14,
        status: 'ANALYZED',
        extractedText: 'Sample Master Cloud & SaaS Agreement 2026 containing SLAs, Notice Windows, Security Obligations and Data Handling Terms.',
        pages: {
          create: [
            {
              pageNumber: 1,
              sectionTitle: 'Section 1 - Definitions & Scope',
              textContent: 'This Master Cloud Services Agreement ("Agreement") is entered into by and between Acme Cloud Solutions ("Supplier") and Enterprise Corp ("Client").',
            },
            {
              pageNumber: 5,
              sectionTitle: 'Section 5 - Security & Audit',
              textContent: 'Supplier shall undergo an Annual Cyber Risk Assessment Audit within 45 days of the start of each calendar fiscal year.',
            },
            {
              pageNumber: 12,
              sectionTitle: 'Section 12 - Term & Renewal',
              textContent: 'Either party may terminate this agreement without cause by providing at least 60 days prior written notice prior to the expiration of the term.',
            },
          ],
        },
      },
    });
    console.log(`Created sample contract: ${seedContract.title}`);
  }

  // Deterministic Stage 6 Deadlines Examples
  const now = new Date();

  const deterministicDeadlines = [
    // 1. Upcoming Deadline
    {
      title: 'Annual Cyber Risk Assessment Audit',
      description: 'Supplier must submit third-party SOC 2 Type II and ISO 27001 audit report.',
      dueDate: new Date(now.getTime() + 45 * 24 * 3600 * 1000),
      deadlineText: 'Within 45 days of fiscal year start',
      noticeDays: 30,
      noticePeriodText: '30 days prior written notice',
      responsibleParty: 'Supplier',
      status: 'UPCOMING',
      severity: 'HIGH',
      confidence: 0.95,
      pageNumber: 5,
      clauseNumber: 'Section 5.4',
      evidenceText: 'Supplier shall undergo an Annual Cyber Risk Assessment Audit within 45 days of fiscal year start.',
    },
    // 2. Overdue Deadline
    {
      title: 'Q2 Vulnerability Remediation Report',
      description: 'Vendor mandatory submission of critical vulnerability patch verification.',
      dueDate: new Date(now.getTime() - 15 * 24 * 3600 * 1000),
      deadlineText: 'Due on June 15, 2026',
      noticeDays: 14,
      noticePeriodText: '14 days notice window',
      responsibleParty: 'Vendor',
      status: 'OVERDUE',
      severity: 'CRITICAL',
      confidence: 0.9,
      pageNumber: 8,
      clauseNumber: 'Clause 8.1',
      evidenceText: 'Vendor must provide critical vulnerability patch report no later than 15 days following quarter end.',
    },
    // 3. Completed Deadline
    {
      title: 'Initial Data Protection Impact Assessment (DPIA)',
      description: 'Submission of GDPR Article 35 risk assessment report.',
      dueDate: new Date(now.getTime() - 60 * 24 * 3600 * 1000),
      deadlineText: 'Prior to contract commencement',
      noticeDays: 30,
      noticePeriodText: 'Completed upon onboarding',
      responsibleParty: 'Data Processor',
      status: 'COMPLETED',
      severity: 'MEDIUM',
      confidence: 1.0,
      pageNumber: 3,
      clauseNumber: 'Clause 3.2',
      evidenceText: 'Data Processor shall complete and deliver the DPIA prior to processing customer PII.',
    },
    // 4. Deadline with Notice Period (Due Soon)
    {
      title: 'MSA Contract Non-Renewal Written Notice Window',
      description: 'Advance notice deadline to opt out of automatic 1-year contract extension.',
      dueDate: new Date(now.getTime() + 5 * 24 * 3600 * 1000),
      deadlineText: 'At least 60 days prior to contract expiration date',
      noticeDays: 60,
      noticePeriodText: '60 days advance written notice mandatory',
      responsibleParty: 'Client',
      status: 'DUE_SOON',
      severity: 'CRITICAL',
      confidence: 0.92,
      pageNumber: 12,
      clauseNumber: 'Section 12.3',
      evidenceText: 'Either party may prevent automatic renewal by providing written non-renewal notice at least 60 days prior.',
    },
    // 5. Ambiguous Deadline requiring NEEDS_REVIEW
    {
      title: 'Discontinued Service Data Migration & Purge Phase-Out',
      description: 'Permanent deletion of legacy data upon service transition.',
      dueDate: null,
      deadlineText: 'Upon mutually agreed phase-out schedule following transition',
      noticeDays: 30,
      noticePeriodText: 'To be determined upon phase-out',
      responsibleParty: 'NEEDS_REVIEW',
      status: 'NEEDS_REVIEW',
      severity: 'MEDIUM',
      confidence: 0.65,
      pageNumber: 14,
      clauseNumber: 'Section 14.7',
      evidenceText: 'Purge shall occur upon mutually agreed phase-out schedule following transition completion.',
    },
  ];

  for (const d of deterministicDeadlines) {
    const existing = await prisma.deadline.findFirst({
      where: { contractId: seedContract.id, title: d.title },
    });

    if (!existing) {
      await prisma.deadline.create({
        data: {
          contractId: seedContract.id,
          title: d.title,
          description: d.description,
          dueDate: d.dueDate,
          deadlineText: d.deadlineText,
          noticeDays: d.noticeDays,
          noticePeriodText: d.noticePeriodText,
          responsibleParty: d.responsibleParty,
          status: d.status,
          severity: d.severity,
          confidence: d.confidence,
          pageNumber: d.pageNumber,
          clauseNumber: d.clauseNumber,
          evidenceText: d.evidenceText,
        },
      });
      console.log(`Created seed deadline: ${d.title} [Status: ${d.status}]`);
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
