// Custom violation callback function that prints a list of violations
// Used when logging to the Cypress log
const severityIndicators = {
  minor:    '⚪',
  moderate: '🟡',
  serious:  '🟠',
  critical: '🔴',
};

// Used to track where multiple checks are done in a test to ensure we save
// the screenshots for them to unique filenames
const screenshotIndexes: {[key: string]: number} = {};

// Log violations to the terminal
function terminalLog(violations) {
  const suiteTitle = Cypress.currentTest.titlePath.slice(0, -1).join(' > ');
  const testTitle = Cypress.currentTest.titlePath.slice(-1)[0];

  cy.task('log', `\n📝 Test Suite: ${ suiteTitle }`);
  cy.task('log', `📌 Test Case: ${ testTitle }`);
  cy.task('log', `❌ ${ violations.length } accessibility violation(s) detected\n`);

  // pluck specific keys to keep the table readable
  const violationData = violations.map(
    ({
      id, impact, description, nodes
    }) => ({
      id,
      impact,
      description,
      nodes: nodes.length
    })
  );

  cy.task('table', violationData);
}

/**
 * Log the violations in several ways:
 * 1. Log to the terminal
 * 2. Log to a file
 * 3. Log to the Cypress log
 * 4. Save screenshot of the violations
 */
function getAccessibilityViolationsCallback(description?: string) {
  return function printAccessibilityViolations(violations) {
    terminalLog(violations); // Log to the console

    const title = Cypress.currentTest.titlePath.join(', ');
    const index = screenshotIndexes[title] || 1;
    const testPath = Cypress.currentTest.titlePath;
    const lastName = Cypress.currentTest.titlePath[Cypress.currentTest.titlePath.length - 1];

    testPath.push(description || `${ lastName } (#${ index })`);

    cy.task('a11y', {
      violations,
      titlePath: testPath,
    });

    // Log in Cypress
    violations.forEach((violation) => {
      const nodes = Cypress.$(violation.nodes.map((item) => item.target).join(','));

      Cypress.log({
        name:         `${ severityIndicators[violation.impact] } A11y`,
        consoleProps: () => violation,
        $el:          nodes,
        message:      `[${ violation.help }][${ violation.helpUrl }]`
      });

      violation.nodes.forEach(({ target }) => {
        Cypress.log({
          name:         `🔨`,
          consoleProps: () => violation,
          $el:          Cypress.$(target.join(',')),
          message:      target
        });

        // Store the existing border and change it to clearly show the elements with violations
        cy.get(target.join(', ')).invoke('css', 'border').then((border) => {
          cy.get(target.join(', ')).then(($el) => {
            const existingBorder = $el.data('border');

            // If we have the original border, don't store again = covers a case an element has multiple violations
            // and we would lose the original border
            if (!existingBorder) {
              $el.data('border', border);
            }

            $el.css('border', '2px solid red');
          });
        });
      });
    });

    // wait for DOM update for red border paint of a11y
    cy.wait(500); // eslint-disable-line cypress/no-unnecessary-waiting

    const cleanTestTitle = Cypress.currentTest.title.replace(/[\s"']+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
    const screenshotName = `a11y_${ cleanTestTitle }_${ index }`;

    cy.screenshot(screenshotName);

    // Record the screenshot against the test and move it into the a11y folder
    cy.task('a11yScreenshot', {
      titlePath: testPath,
      test:      Cypress.currentTest,
      name:      screenshotName
    });

    screenshotIndexes[title] = index + 1;

    // Reset the borders that were added to mark the elements with violations
    violations.forEach((violation) => {
      violation.nodes.forEach(({ target }) => {
        cy.get(target.join(', ')).then(($el) => {
          const border = $el.data('border');

          if (!border.startsWith('0px none')) {
            $el.css('border', $el.data('border'));
          } else {
            $el.css('border', '');
          }

          if ($el.attr('style')?.length === 0) {
            $el.removeAttr('style');
          }
        });
      });
    });
  };
}

/**
 * Checks accessibility of the entire page
 */
// skipFailures = true will not fail the test when there are accessibility failures
Cypress.Commands.add('checkPageAccessibility', (description?: string) => {
  cy.waitForAppToLoad();

  cy.checkA11y(undefined, {}, getAccessibilityViolationsCallback(description), true);
});

/**
 * Checks accessibility of a specific element
 */
// skipFailures = true will not fail the test when there are accessibility failures
Cypress.Commands.add('checkElementAccessibility', (subject: any, description?: string) => {
  cy.waitForAppToLoad();

  cy.get(subject).then(($el) => {
    cy.log(`✅ Found ${ $el.length } elements matching`);
  });

  cy.checkA11y(subject, {}, getAccessibilityViolationsCallback(description), true);
});
