/**
 * Fast require graph check (Windows friendly).
 * Fails early if a module path is missing.
 */
try {
  require('../src/routes');
  console.log('✅ require-check OK (routes loaded)');
  process.exit(0);
} catch (e) {
  console.error('❌ require-check FAILED');
  console.error(e);
  process.exit(1);
}
