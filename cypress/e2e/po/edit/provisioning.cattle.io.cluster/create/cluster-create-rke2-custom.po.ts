import PagePo from '@/cypress/e2e/po/pages/page.po';
import AgentConfigurationRke2 from '@/cypress/e2e/po/components/agent-configuration-rke2.po';
import ClusterManagerCreatePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create.po';

/**
 * Create page for an RKE2 custom cluster
 */
export default class ClusterManagerCreateRke2CustomPagePo extends ClusterManagerCreatePagePo {
  static url(clusterId: string) {
    return `${ ClusterManagerCreatePagePo.url(clusterId) }/create?type=custom#basic`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(ClusterManagerCreateRke2CustomPagePo.url(clusterId));
  }

  goToCustomClusterCreation(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(`${ ClusterManagerCreatePagePo.url(clusterId) }?type=custom#basic`);
  }

  goToDigitalOceanCreation(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(`${ ClusterManagerCreatePagePo.url(clusterId) }?type=digitalocean#basic`);
  }

  title(): Cypress.Chainable<string> {
    return this.self().find('.primaryheader h1').invoke('text');
  }

  agentConfiguration(): AgentConfigurationRke2 {
    return new AgentConfigurationRke2();
  }
}
