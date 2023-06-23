import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import SelectPrincipalPo from '@/cypress/e2e/po/components/select-principal.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';

export default class ClusterProjectMembersPo extends PagePo {
  private static createPath(clusterId: string, tabId: string) {
    return `/c/${ clusterId }/explorer/members#${ tabId }`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId: string = 'local', tabId: string = 'cluster-membership') {
    super(ClusterProjectMembersPo.createPath(clusterId, tabId));
  }

  triggerAddClusterOrProjectMemberAction() {
    return cy.get('.btn.role-primary.pull-right').click();
  }

  selectClusterOrProjectMember(name: string) {
    const selectClusterOrProjectMember = new SelectPrincipalPo(`[data-testid="cluster-member-select"]`, this.self());

    selectClusterOrProjectMember.toggle();
    selectClusterOrProjectMember.filterByName(name);
    selectClusterOrProjectMember.clickOptionWithLabel(name);
  }

  saveCreateForm(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }

  listElementWithName(name:string) {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.resourceTable().sortableTable().rowElementWithName(name);
  }
}
