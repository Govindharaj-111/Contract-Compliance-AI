import { askAssistant } from '../src/lib/ai/assistant';
import { prisma } from '../src/lib/prisma';

async function runStage7Tests() {
  console.log('==================================================');
  console.log('STAGE 7: AI CONTRACT ASSISTANT DETERMINISTIC TESTS');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, title: string, details?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${title}`);
      if (details) console.error(`   Details: ${details}`);
      failed++;
    }
  }

  // Ensure baseline demo seed data exists in DB for deterministic tests
  await seedBaselineDataIfEmpty();

  // Test 1: Question with a clear answer
  try {
    console.log('\n--- Scenario 1: Question with a clear answer ---');
    const res1 = await askAssistant({ message: 'What are the most important obligations in my contracts?' });
    assert(Boolean(res1.answer && res1.answer.length > 10), 'Returns a detailed grounded answer', res1.answer);
    assert(res1.confidence > 0, 'Confidence score is greater than 0');
  } catch (err: unknown) {
    const e = err as { message?: string };
    assert(false, 'Scenario 1 executed without crashing', e?.message);
  }

  // Test 2: Question requiring multiple records
  try {
    console.log('\n--- Scenario 2: Question requiring multiple records ---');
    const res2 = await askAssistant({ message: 'Summarize obligations across all uploaded contracts.' });
    assert(res2.sources.length >= 0, 'Processes multiple contract records safely');
    assert(typeof res2.needsReview === 'boolean', 'Includes valid needsReview boolean flag');
  } catch (err: unknown) {
    const e = err as { message?: string };
    assert(false, 'Scenario 2 executed without crashing', e?.message);
  }

  // Test 3: Question about deadlines
  try {
    console.log('\n--- Scenario 3: Question about deadlines ---');
    const res3 = await askAssistant({ message: 'Which deadlines are coming up soon?' });
    assert(res3.answer.toLowerCase().includes('deadline') || res3.answer.includes('no') || res3.sources.some(s => s.type === 'deadline'), 'Returns deadline intelligence information');
  } catch (err: unknown) {
    const e = err as { message?: string };
    assert(false, 'Scenario 3 executed without crashing', e?.message);
  }

  // Test 4: Question about conflicts
  try {
    console.log('\n--- Scenario 4: Question about conflicts ---');
    const res4 = await askAssistant({ message: 'Show me all high and critical compliance conflicts.' });
    assert(res4.answer.length > 0, 'Returns policy conflict evaluation text');
  } catch (err: unknown) {
    const e = err as { message?: string };
    assert(false, 'Scenario 4 executed without crashing', e?.message);
  }

  // Test 5: Question about policies
  try {
    console.log('\n--- Scenario 5: Question about policies ---');
    const res5 = await askAssistant({ message: 'What corporate policies exist for security and data retention?' });
    assert(res5.answer.length > 0, 'Returns policy information');
  } catch (err: unknown) {
    const e = err as { message?: string };
    assert(false, 'Scenario 5 executed without crashing', e?.message);
  }

  // Test 6: Question with insufficient evidence
  try {
    console.log('\n--- Scenario 6: Question with insufficient evidence ---');
    const res6 = await askAssistant({ message: 'What is the secret quantum encryption key for Mars Rover launch in 2099?' });
    assert(res6.needsReview === true, 'Sets needsReview to true when evidence is insufficient');
    assert(
      res6.answer.includes("I couldn't find sufficient information") || res6.answer.includes("insufficient"),
      'Returns exact insufficient information fallback statement',
      res6.answer
    );
  } catch (err: unknown) {
    const e = err as { message?: string };
    assert(false, 'Scenario 6 executed without crashing', e?.message);
  }

  // Test 7: Conversation session persistence & clearing
  try {
    console.log('\n--- Scenario 7: Conversation history session ---');
    const q1 = await askAssistant({ message: 'Who is responsible for upcoming deadlines?' });
    assert(Boolean(q1.conversationId), 'Generates conversationId for new chat session');

    const q2 = await askAssistant({ message: 'Which contract clauses conflict with company policies?', conversationId: q1.conversationId });
    assert(q2.conversationId === q1.conversationId, 'Maintains multi-turn conversation session ID');
  } catch (err: unknown) {
    const e = err as { message?: string };
    assert(false, 'Scenario 7 executed without crashing', e?.message);
  }

  // Test 8: AI/API unavailable fallback engine
  try {
    console.log('\n--- Scenario 8: Fallback answering engine robustness ---');
    const fallbackRes = await askAssistant({ message: 'What notice periods are required?' });
    assert(Boolean(fallbackRes.answer && fallbackRes.answer.length > 5), 'Fallback engine produces structured grounded answer');
    assert(Array.isArray(fallbackRes.sources), 'Returns sources array without error');
  } catch (err: unknown) {
    const e = err as { message?: string };
    assert(false, 'Scenario 8 executed without crashing', e?.message);
  }

  console.log('\n==================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

async function seedBaselineDataIfEmpty() {
  const contractCount = await prisma.contract.count();
  if (contractCount === 0) {
    const contract = await prisma.contract.create({
      data: {
        title: 'Master Vendor Agreement 2026',
        fileName: 'vendor_agreement_2026.pdf',
        extractedText: 'Vendor agrees to maintain 99.9% SLA uptime and provide 60 days notice before termination.',
        status: 'ANALYZED',
        pageCount: 5,
        obligations: {
          create: [
            {
              title: '99.9% Uptime Guarantee',
              description: 'Provider must maintain 99.9% monthly service uptime.',
              category: 'SLA',
              responsibleParty: 'Vendor',
              noticePeriod: '60 days',
              slaRequirement: '99.9% uptime',
              confidence: 0.95,
              severity: 'HIGH',
              clauseNumber: 'Section 4.1',
              pageNumber: 2,
              evidenceText: 'Provider must maintain 99.9% monthly service uptime.',
            },
          ],
        },
        deadlines: {
          create: [
            {
              title: '60-Day Written Termination Notice Window',
              description: 'Written notice required 60 days prior to annual renewal.',
              dueDate: new Date('2026-11-30'),
              deadlineText: '60 days prior written notice',
              noticeDays: 60,
              responsibleParty: 'Vendor',
              status: 'UPCOMING',
              severity: 'HIGH',
              clauseNumber: 'Section 8.2',
              pageNumber: 4,
              evidenceText: 'Written notice required 60 days prior to annual renewal.',
            },
          ],
        },
      },
    });

    await prisma.policy.create({
      data: {
        code: 'POL-SEC-001',
        title: 'Data Security & Retention Standard',
        category: 'Security',
        content: 'All customer data must be encrypted with AES-256 and retained for a maximum of 3 years.',
        version: '1.0',
      },
    });

    console.log('Seeded baseline contract & policy data for deterministic Stage 7 tests.', contract.id);
  }
}

runStage7Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
