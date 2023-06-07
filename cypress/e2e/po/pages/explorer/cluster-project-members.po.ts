import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';

export default class ClusterProjectMembersPo extends PagePo {
  static url: string = '/c/local/explorer/members#cluster-membership'

  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ClusterProjectMembersPo.url);
  }

  constructor(url: string) {
    super(url || ClusterProjectMembersPo.url);
  }

  triggerAddClusterOrProjectMemberAction() {
    return cy.get('.btn.role-primary.pull-right').click();
  }

  selectClusterOrProjectMember(name: string) {
    const selectClusterOrProjectMember = new LabeledSelectPo(`[data-testid="cluster-member-select"]`, this.self());

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
