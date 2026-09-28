/* global Mocha */
/* eslint-disable no-console */
let qaseImport: any;

try {
  // Try to use the qase function from the reporter if available
  // This is the recommended way for cypress-qase-reporter 3.0.0+
  qaseImport = require('cypress-qase-reporter/mocha').qase;
} catch (e) {
  // Fallback to custom implementation if the import fails
}

/**
 * Custom wrapper for Qase ID integration.
 * If the official reporter is available, it delegates to it.
 * Otherwise, it appends the Qase ID to the test title manually.
 */
export const qase = (caseId: number | number[], test: Mocha.Test): Mocha.Test => {
  if (qaseImport) {
    try {
      return qaseImport(caseId, test);
    } catch (e) {
      console.warn('Qase reporter import failed at runtime, falling back to manual title update.');
    }
  }

  // Custom fallback implementation
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!test || !test.title) {
    return test;
  }
  const caseIds = Array.isArray(caseId) ? caseId : [caseId];

  test.title = `${ test.title } (Qase ID: ${ caseIds.join(',') })`;

  return test;
};
