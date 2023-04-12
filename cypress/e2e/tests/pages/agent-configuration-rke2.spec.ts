import AgentConfigurationRke2 from '~/cypress/e2e/po/pages/agent-configuration-rke2.po';

describe('Agent Configuration for RKE2', () => {
  beforeEach(() => {
    cy.login();
    AgentConfigurationRke2.goTo();
  });

  it('Should send the correct payload to the server', () => {
    const agentConfigurationRke2 = new AgentConfigurationRke2();

    // we should be on the custom cluster creation screen
    agentConfigurationRke2.title().should('contain', 'Cluster: Create Custom');

    agentConfigurationRke2.fillRequestandLimitsForm('cluster', {
      request: {
        cpu:    1,
        memory: 1
      },
      limit: {
        cpu:    2,
        memory: 2
      },
    });

    agentConfigurationRke2.fillTolerationsForm('cluster', [
      {
        key:      'key1',
        operator: 2,
        value:    'val1',
        effect:   2
      },
      {
        key:      'key2',
        operator: 2,
        value:    'val2',
        effect:   2
      }
    ]);
  });
});
