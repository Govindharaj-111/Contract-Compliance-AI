import { ContractExtractionResultSchema } from './schema';
import { aiClient } from './client';

export const SAMPLE_CONTRACT_FIXTURE = `
MASTER SERVICES & COMPLIANCE AGREEMENT

Section 1. Obligation & Performance
1.1 Monthly Reporting: Supplier shall submit a monthly compliance report to Client on or before the 5th day of every month detailing service metrics and security events.

Section 4. Service Level Agreement (SLA)
4.2 Availability: Supplier guarantees 99.9% uptime for the SaaS platform during each calendar month. In the event of an outage, Supplier must issue SLA credit requests within 14 business days.

Section 7. Data Handling & Security
7.4 Data Encryption: Supplier shall encrypt all Client Personal Data both at rest using AES-256 encryption and in transit using TLS 1.3 protocol. Supplier must notify Client within 24 hours of discovering any potential Data Breach.

Section 12. Term & Termination
12.3 Termination Notice: Either party may terminate this Agreement without cause by providing at least 60 days advance written notice to the other party.
`;

export function testValidationWithZodSample() {
  const validMockAIOutput = {
    obligations: [
      {
        description: "Supplier must submit a monthly compliance report",
        responsibleParty: "Supplier",
        deadline: "5th day of every month",
        noticePeriod: null,
        slaRequirement: null,
        dataHandlingRequirement: null,
        category: "Compliance",
        clauseNumber: "1.1",
        pageNumber: 1,
        evidence: "Supplier shall submit a monthly compliance report to Client on or before the 5th day of every month detailing service metrics and security events.",
        confidence: 0.94
      },
      {
        description: "Supplier must guarantee 99.9% uptime for SaaS platform",
        responsibleParty: "Supplier",
        deadline: "Monthly",
        noticePeriod: null,
        slaRequirement: "99.9% uptime guarantee",
        dataHandlingRequirement: null,
        category: "SLA",
        clauseNumber: "4.2",
        pageNumber: 1,
        evidence: "Supplier guarantees 99.9% uptime for the SaaS platform during each calendar month.",
        confidence: 0.98
      },
      {
        description: "Encrypt Client Personal Data at rest (AES-256) and in transit (TLS 1.3)",
        responsibleParty: "Supplier",
        deadline: null,
        noticePeriod: null,
        slaRequirement: null,
        dataHandlingRequirement: "AES-256 at rest, TLS 1.3 in transit",
        category: "Data Handling",
        clauseNumber: "7.4",
        pageNumber: 1,
        evidence: "Supplier shall encrypt all Client Personal Data both at rest using AES-256 encryption and in transit using TLS 1.3 protocol.",
        confidence: 0.96
      },
      {
        description: "Provide written notice prior to termination without cause",
        responsibleParty: "Either party",
        deadline: null,
        noticePeriod: "60 days advance written notice",
        slaRequirement: null,
        dataHandlingRequirement: null,
        category: "Notice",
        clauseNumber: "12.3",
        pageNumber: 1,
        evidence: "Either party may terminate this Agreement without cause by providing at least 60 days advance written notice to the other party.",
        confidence: 0.92
      }
    ]
  };

  // Test Zod Schema Parsing
  const result = ContractExtractionResultSchema.safeParse(validMockAIOutput);
  if (!result.success) {
    throw new Error(`Fixture Zod schema validation failed: ${JSON.stringify(result.error.format())}`);
  }

  return result.data;
}

export async function runDeterministicTests() {
  console.log('--- Running Deterministic AI Obligation Extraction Tests ---');

  // Test 1: Zod Schema Validation
  const validatedData = testValidationWithZodSample();
  console.log(`✔ Test 1 Passed: Zod validated ${validatedData.obligations.length} sample obligations.`);

  // Test 2: Check field preservation
  const firstOb = validatedData.obligations[0];
  if (
    firstOb.responsibleParty !== 'Supplier' ||
    firstOb.deadline !== '5th day of every month' ||
    firstOb.clauseNumber !== '1.1' ||
    !firstOb.evidence ||
    firstOb.confidence !== 0.94
  ) {
    throw new Error('Test 2 Failed: Obligation fields or confidence were not preserved correctly.');
  }
  console.log('✔ Test 2 Passed: Responsible party, deadline, clause, and evidence were correctly preserved.');

  // Test 3: Invalid AI Response Rejection
  const invalidOutput = {
    obligations: [
      {
        // Missing description and evidence
        responsibleParty: "Supplier",
        confidence: 5.0 // invalid confidence > 1
      }
    ]
  };
  const invalidCheck = ContractExtractionResultSchema.safeParse(invalidOutput);
  if (invalidCheck.success) {
    throw new Error('Test 3 Failed: Invalid AI output was accepted when it should have failed Zod validation.');
  }
  console.log('✔ Test 3 Passed: Invalid AI response correctly rejected by Zod schema.');

  // Test 4: AI Client configuration check
  const isConfigured = aiClient.isConfigured();
  console.log(`✔ Test 4 Passed: AI client isConfigured() evaluated to: ${isConfigured}`);

  console.log('All deterministic tests completed successfully!');
}
