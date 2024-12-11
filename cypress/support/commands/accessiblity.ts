import { createHtmlReport } from 'axe-html-reporter';

// Custom violation callback function that prints a list of violations
const severityIndicators = {
  minor:    '⚪',
  moderate: '🟡',
  serious:  '🟠',
  critical: '🔴',
};

const RULES = { rules: { 'color-contrast': { enabled: false } } };

// Define at the top of the spec file or just import it
function terminalLog(violations) {
  cy.task(
    'log',
    `${ violations.length } accessibility violation${
      violations.length === 1 ? '' : 's'
    } ${ violations.length === 1 ? 'was' : 'were' } detected`
  );
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

function logToFile(violations) {
  cy.writeFile('accessibilityReport.json', `${ JSON.stringify(violations, null, 2) } \n`, { flag: 'a+' });
}

function printAccessibilityViolations(violations) {
  // Log to the console
  terminalLog(violations);
  logToFile(violations);

  cy.task('a11y', violations);

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

      cy.get(target.join(', ')).then(($el) => {
        $el.css('border', '2px solid red');
      });

      // Highlight each node so that they are visible when we take a screenshot
      // Cypress.$(target.join(',')).css('style', 'border: 2px solid red');
    });
  });

  cy.task('log', Cypress.currentTest);
  cy.screenshot(`a11y_${ Cypress.currentTest.title }`);
}

// skipFailures = true will not fail the test when there are accessibility failures
Cypress.Commands.add('checkAccessibility', (subject: any) => {
  cy.checkA11y(subject, RULES, printAccessibilityViolations, true);
});
