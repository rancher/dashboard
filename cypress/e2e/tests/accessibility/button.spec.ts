const severityIndicators = {
  minor:  '⚪',
  moderate:  '🟡',
  serious:  '🟠',
  critical:  '🔴',
}

function terminalLog(violations) {
  violations.forEach(violation => {
    const nodes = Cypress.$(violation.nodes.map(item => item.target).join(','));

    Cypress.log({
      name: `${severityIndicators[violation.impact]} A11y`,
      consoleProps: () => violation,
      $el: nodes,
      message: `[${violation.help}][${violation.helpUrl}]`
    })

    violation.nodes.forEach(({ target }) => {
      Cypress.log({
        name: `🔨`,
        consoleProps: () => violation,
        $el: Cypress.$(target.join(',')),
        message: target
      })
    })
  })
}

describe('Button a11y testing', { tags: ['@adminUser', '@standardUser'] }, () => {
  beforeEach(() => {
    cy.visit(`${ Cypress.config().baseUrl }`);
    cy.injectAxe();
    cy.wait(600); 
  });

  it('wcag21aa test: Primary button color', () => {
    cy.checkA11y(
      '.role-primary',
      {
        runOnly: {
          type: 'tag',
          values: ['wcag21aa']
        },
        rules: {
          // Rest of the rules can be found at https://dequeuniversity.com/rules/axe/4.3
          'color-contrast': { enabled: true }
        }
      },
      terminalLog
    )

    // cy.checkA11y();
  });
});
