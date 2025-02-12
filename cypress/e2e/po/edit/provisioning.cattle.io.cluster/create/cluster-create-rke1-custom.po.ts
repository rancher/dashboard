import PagePo from '@/cypress/e2e/po/pages/page.po';
import ClusterManagerCreatePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create.po';
import EmberInputPo from '@/cypress/e2e/po/components/ember/ember-input.po';
import ClusterManagerCreateRKE1PagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke1.po';
import EmberAccordionPo from '@/cypress/e2e/po/components/ember/ember-accordion.po';
import EmberFormMembersPo from '@/cypress/e2e/po/components/ember/ember-form-members.po';
import EmberCheckboxInputPo from '@/cypress/e2e/po/components/ember/ember-checkbox-input.po';
import EmberSelectPo from '@/cypress/e2e/po/components/ember/ember-select.po';

/**
 * Create page for an RKE1 custom cluster
 */
export default class ClusterManagerCreateRke1CustomPagePo extends ClusterManagerCreateRKE1PagePo {
  static url(clusterId: string) {
    return `${ ClusterManagerCreateRKE1PagePo.url(clusterId) }/create?type=custom`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(ClusterManagerCreateRke1CustomPagePo.url(clusterId));
  }

  goToCustomClusterCreation(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(`${ ClusterManagerCreatePagePo.url(clusterId) }?type=custom`);
  }

  // Create/Edit Page

  clusterName(): EmberInputPo {
    return new EmberInputPo('[data-testid="form-name-description__name"]');
  }

  memberRoles(): EmberAccordionPo {
    return new EmberAccordionPo('cru-cluster__members');
  }

  memberRolesFormMembers(): EmberFormMembersPo {
    return new EmberFormMembersPo('[data-testid="cru-cluster__members__form"]') ;
  }

  clusterTemplateCheckbox(): EmberCheckboxInputPo {
    return new EmberCheckboxInputPo('.cluster-template-select');
  }

  rkeTemplateAndRevisionDropdown(): EmberSelectPo {
    return new EmberSelectPo('.new-select > select');
  }

  selectedOption(): EmberSelectPo {
    return new EmberSelectPo('.new-select > select option:selected');
  }

  // Roles Page

  nodeCommand(): EmberAccordionPo {
    return new EmberAccordionPo('cluster-driver__role');
  }

  etcdRole() {
    return this.nodeCommand().content().find('div.row > div:nth-of-type(1) > label > input');
  }

  cpRole() {
    return this.nodeCommand().content().find('div.row > div:nth-of-type(2) > label > input');
  }

  workerRole() {
    return this.nodeCommand().content().find('div.row > div:nth-of-type(3) > label > input');
  }

  registrationCommand() {
    return this.nodeCommand().content().find('#registration-command');
  }
}
