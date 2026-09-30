import { calculateContractRisk, calculateVendorRating } from '../src/lib/ai/risk-scoring';

async function runStage8Tests() {
  console.log('==================================================');
  console.log('STAGE 8: AUTOMATED RISK SCORING & ANALYTICS TESTS');
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

  // Test 1: Low Risk Contract Calculation
  try {
    console.log('\n--- Scenario 1: Low Risk Contract Calculation ---');
    const lowRisk = calculateContractRisk({
      contractId: 'c-1',
      contractTitle: 'Standard Non-Disclosure Agreement',
      conflicts: [],
      deadlines: [{ status: 'UPCOMING', severity: 'LOW' }],
      obligations: [{ category: 'Compliance', severity: 'LOW', status: 'FULFILLED' }],
    });
    assert(lowRisk.riskScore < 25, 'Calculates low risk score (<25)', `Score: ${lowRisk.riskScore}`);
    assert(lowRisk.riskLevel === 'LOW', 'Assigns LOW risk level tier');
  } catch (err: unknown) {
    const e = err as { message?: string };
    assert(false, 'Scenario 1 executed without error', e?.message);
  }

  // Test 2: Critical Risk Contract Calculation
  try {
    console.log('\n--- Scenario 2: Critical Risk Contract Calculation ---');
    const criticalRisk = calculateContractRisk({
      contractId: 'c-2',
      contractTitle: 'Breached Data Processing Agreement',
      conflicts: [
        { severity: 'CRITICAL', status: 'UNRESOLVED' },
        { severity: 'HIGH', status: 'UNRESOLVED' },
      ],
      deadlines: [{ status: 'OVERDUE', severity: 'CRITICAL' }],
      obligations: [{ category: 'Data Handling', severity: 'CRITICAL', status: 'BREACHED' }],
    });
    assert(criticalRisk.riskScore >= 75, 'Calculates high risk score (>=75)', `Score: ${criticalRisk.riskScore}`);
    assert(criticalRisk.riskLevel === 'CRITICAL', 'Assigns CRITICAL risk level tier');
    assert(criticalRisk.factors.length > 0, 'Includes risk contributing factors breakdown');
  } catch (err: unknown) {
    const e = err as { message?: string };
    assert(false, 'Scenario 2 executed without error', e?.message);
  }

  // Test 3: Vendor Compliance Rating & Grade Calculation
  try {
    console.log('\n--- Scenario 3: Vendor Compliance Grade A+ ---');
    const vendorA = calculateVendorRating({
      vendorName: 'Acme Cloud Services',
      role: 'Vendor',
      contractsCount: 2,
      obligations: [{ status: 'FULFILLED' }],
      deadlines: [{ status: 'UPCOMING' }],
      conflicts: [],
    });
    assert(vendorA.compliancePercentage >= 95, 'Calculates high compliance percentage');
    assert(vendorA.grade === 'A+', 'Assigns A+ grade for flawless vendor performance');
  } catch (err: unknown) {
    const e = err as { message?: string };
    assert(false, 'Scenario 3 executed without error', e?.message);
  }

  // Test 4: Vendor Compliance Rating Grade F for Overdue & Breaches
  try {
    console.log('\n--- Scenario 4: Vendor Compliance Grade F ---');
    const vendorF = calculateVendorRating({
      vendorName: 'NonCompliant Tech Inc',
      role: 'Supplier',
      contractsCount: 1,
      obligations: [{ status: 'BREACHED' }, { status: 'BREACHED' }],
      deadlines: [{ status: 'OVERDUE' }, { status: 'OVERDUE' }],
      conflicts: [{ severity: 'CRITICAL' }, { severity: 'HIGH' }],
    });
    assert(vendorF.compliancePercentage < 40, 'Calculates low compliance percentage', `Pct: ${vendorF.compliancePercentage}%`);
    assert(vendorF.grade === 'F' || vendorF.grade === 'D', 'Assigns failing grade D/F to delinquent vendor');
  } catch (err: unknown) {
    const e = err as { message?: string };
    assert(false, 'Scenario 4 executed without error', e?.message);
  }

  console.log('\n==================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) process.exit(1);
}

runStage8Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
