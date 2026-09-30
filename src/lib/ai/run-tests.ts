import { runDeterministicTests } from './test-fixture';
import { runStep5DeterministicTests } from './conflict-test-fixture';

async function main() {
  console.log('--- Running Obligation Extraction Tests ---');
  await runDeterministicTests();

  console.log('--- Running Policy Conflict Detection Engine Tests ---');
  await runStep5DeterministicTests();
}

main()
  .then(() => {
    console.log('SUCCESS: All Step 4 & Step 5 deterministic AI tests passed!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('FAILURE: Deterministic test error:', err);
    process.exit(1);
  });
