import PagePo from '@/cypress/e2e/po/pages/page.po';
import AgentConfigurationRke2 from '@/cypress/e2e/po/components/agent-configuration-rke2.po';
import ClusterManagerCreatePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create.po';
import TabbedPo from '~/cypress/e2e/po/components/tabbed.po';
import RegistriesRke2 from '@/cypress/e2e/po/components/registries-rke2.po';

/**
 * Create page for an RKE2 custom cluster
 */
export default class ClusterManagerCreateRke2CustomPagePo extends ClusterManagerCreatePagePo {
  static url = `${ ClusterManagerCreatePagePo.url }/create?type=custom#basic`
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(ClusterManagerCreateRke2CustomPagePo.url);
  }

  goToCustomClusterCreation(): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(`${ ClusterManagerCreatePagePo.url }?type=custom#basic`);
  }

  goToDigitalOceanCreation(): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(`${ ClusterManagerCreatePagePo.url }?type=digitalocean#basic`);
  }

  title(): Cypress.Chainable<string> {
    return this.self().find('.primaryheader h1').invoke('text');
  }

  clusterConfigurationTabs(): TabbedPo {
    return new TabbedPo();
  }

  agentConfiguration(): AgentConfigurationRke2 {
    return new AgentConfigurationRke2();
  }

  registries(): RegistriesRke2 {
    return new RegistriesRke2();
  }
}
