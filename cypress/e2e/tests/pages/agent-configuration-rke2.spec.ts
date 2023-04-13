import AgentConfigurationRke2 from '~/cypress/e2e/po/pages/agent-configuration-rke2.po';
import {
  podAffinityData,
  requestAndLimitsData,
  tolerationsData,
  nodeAffinityData
} from '@/cypress/e2e/tests/pages/data/agent-configuration-rke2-data';

describe('Agent Configuration for RKE2', () => {
  beforeEach(() => {
    cy.login();
    AgentConfigurationRke2.goTo();
  });

  it('Should send the correct payload to the server', () => {
    const agentConfigurationRke2 = new AgentConfigurationRke2();

    /*
      TODOS:
      - missing cluster name fill
      - move to fleet agent tab
      - fill all fleet agent forms
    */

    // we should be on the custom cluster creation screen (starts on cluster agent tab as per url of goTo)
    agentConfigurationRke2.title().should('contain', 'Cluster: Create Custom');

    // // fill requests and limits form
    // agentConfigurationRke2.fillRequestandLimitsForm('cluster', requestAndLimitsData);

    // // fill tolerations form
    // agentConfigurationRke2.fillTolerationsForm('cluster', tolerationsData);

    // Select custom affinity rules
    agentConfigurationRke2.selectAffinityOption('cluster', 1);

    // // fill form for pod affinity/anti-affinity
    // agentConfigurationRke2.fillPodSelectorForm('cluster', podAffinityData);

    // fill form for pod affinity/anti-affinity
    agentConfigurationRke2.fillNodeSelectorForm('cluster', nodeAffinityData);
  });
});
