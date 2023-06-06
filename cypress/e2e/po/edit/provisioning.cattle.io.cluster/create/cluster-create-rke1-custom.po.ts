import PagePo from '@/cypress/e2e/po/pages/page.po';
import ClusterManagerCreatePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create.po';
import EmberInputPo from '@/cypress/e2e/po/components/ember/ember-input.po';
import ClusterManagerCreateRKE1PagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke1.po';
import EmberAccordionPo from '@/cypress/e2e/po/components/ember/ember-accordion.po';

/**
 * Create page for an RKE1 custom cluster
 */
export default class ClusterManagerCreateRke1CustomPagePo extends ClusterManagerCreateRKE1PagePo {
  static url: string = `${ ClusterManagerCreatePagePo.url }/create?type=custom`
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(ClusterManagerCreateRke1CustomPagePo.url);
  }

  goToCustomClusterCreation(): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(`${ ClusterManagerCreatePagePo.url }?type=custom`);
  }

  // Create/Edit Page

  clusterName(): EmberInputPo {
    return new EmberInputPo('[data-testid="form-name-description__name"]');
  }

  memberRoles(): EmberAccordionPo {
    return new EmberAccordionPo('cru-cluster__members');
  }

  // Roles Page

  nodeCommand(): EmberAccordionPo {
    return new EmberAccordionPo('cluster-driver__role');
  }
}
