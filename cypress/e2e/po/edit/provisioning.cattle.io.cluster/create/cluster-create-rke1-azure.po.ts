import PagePo from '@/cypress/e2e/po/pages/page.po';
import ClusterManagerCreatePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create.po';
import EmberInputPo from '@/cypress/e2e/po/components/ember/ember-input.po';
import ClusterManagerCreateRKE1PagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke1.po';
import EmberAccordionPo from '@/cypress/e2e/po/components/ember/ember-accordion.po';
import EmberFormMembersPo from '@/cypress/e2e/po/components/ember/ember-form-members.po';
import EmberCheckboxInputPo from '@/cypress/e2e/po/components/ember/ember-checkbox-input.po';
import EmberSelectPo from '@/cypress/e2e/po/components/ember/ember-select.po';
import EmberFormNodePoolsPo from '@/cypress/e2e/po/components/ember/ember-form-node-pools.po';
import EmberKubernetesOptionsPo from '@/cypress/e2e/po/components/ember/ember-kubernetes-options.po';
import EmberModalAddNodeTemplateAzurePo from '@/cypress/e2e/po/components/ember/ember-modal-add-node-template-azure.po';

/**
 * Create page for an RKE1 azure cluster
 */
export default class ClusterManagerCreateRke1AzurePagePo extends ClusterManagerCreateRKE1PagePo {
  static url(clusterId: string) {
    return `${ ClusterManagerCreatePagePo.url(clusterId) }/create?type=amazonec2`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(ClusterManagerCreateRke1AzurePagePo.url(clusterId));
  }

  goToAmazonec2ClusterCreation(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(`${ ClusterManagerCreatePagePo.url(clusterId) }?type=amazonec2`);
  }

  clusterName(): EmberInputPo {
    return new EmberInputPo('[data-testid="form-name-description__name"]');
  }

  nodePoolTable(): EmberFormNodePoolsPo {
    return new EmberFormNodePoolsPo('div.ember-view');
  }

  kubernetesOptions(): EmberKubernetesOptionsPo {
    return new EmberKubernetesOptionsPo('div.ember-view');
  }

  addNodeTemplate() {
    return cy.iFrame().find('button').contains('Add Node Template').click();
  }

  addNodeTemplateForm(): EmberModalAddNodeTemplateAzurePo {
    return new EmberModalAddNodeTemplateAzurePo();
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

  nodeTemplateDropdown(): EmberSelectPo {
    return new EmberSelectPo('.main-row .new-select > select');
  }

  rkeTemplateAndRevisionDropdown(): EmberSelectPo {
    return new EmberSelectPo('.new-select > select');
  }

  selectedOption(): EmberSelectPo {
    return new EmberSelectPo('.new-select > select option:selected');
  }
}
