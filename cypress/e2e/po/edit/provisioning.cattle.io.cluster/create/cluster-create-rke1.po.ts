import PagePo from '@/cypress/e2e/po/pages/page.po';
import ClusterManagerCreatePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';

/**
 * RKE1 flavour of ClusterManagerCreatePagePo
 *
 * This structure is bit tricky. The page covers selecting an RKE and cluster type AND the rke specific create/edit page
 *
 * The rke create/edit page in this case is ember
 */
export default abstract class ClusterManagerCreateRKE1PagePo extends ClusterManagerCreatePagePo {
  static url(clusterId: string) {
    return `${ ClusterManagerCreatePagePo.url(clusterId) }/create`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(ClusterManagerCreateRKE1PagePo.url(clusterId));
  }

  // Form
  nameNsDescription(): NameNsDescription {
    throw new Error('RKE2 only');
  }

  create(): CypressChainable {
    throw new Error('RKE2 only');
  }

  save(): CypressChainable {
    throw new Error('RKE2 only');
  }

  createRKE1(): CypressChainable {
    return cy.iFrame().find('[data-testid="save-cancel-rke1"] button').contains('Create').click();
  }

  saveRKE1(): CypressChainable {
    return cy.iFrame().find('[data-testid="save-cancel-rke1"] button').contains('Save').click();
  }

  next() {
    return cy.iFrame().find('button').contains('Next').click();
  }

  done() {
    return cy.iFrame().find('[data-testid="driver-rke__done"]').click();
  }
}
