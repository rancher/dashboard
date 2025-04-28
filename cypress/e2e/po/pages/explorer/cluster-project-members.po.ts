import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import SelectPrincipalPo from '@/cypress/e2e/po/components/select-principal.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import SortableTablePo from '@/cypress/e2e/po/components/sortable-table.po';

export default class ClusterProjectMembersPo extends PagePo {
  private static createPath(clusterId: string, tabId: string) {
    return `/c/${ clusterId }/explorer/members#${ tabId }`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = 'local', tabId = 'cluster-membership') {
    super(ClusterProjectMembersPo.createPath(clusterId, tabId));
  }

  triggerAddClusterOrProjectMemberAction() {
    return cy.get('.btn.role-primary.pull-right').click();
  }

  triggerAddProjectMemberAction(projectLabel: string) {
    const cleanLabel = projectLabel.replace(' ', '').toLowerCase();

    return cy.get(`[data-testid="add-project-member-${ cleanLabel }"]`).click();
  }

  selectClusterOrProjectMember(name: string) {
    const selectClusterOrProjectMember = new SelectPrincipalPo(`[data-testid="cluster-member-select"]`, this.self());

    selectClusterOrProjectMember.toggle();
    selectClusterOrProjectMember.filterByName(name);
    selectClusterOrProjectMember.clickOptionWithLabel(name);
  }

  selectProjectCustomPermission() {
    const permissionOptions = new RadioGroupInputPo('[data-testid="permission-options"]');

    permissionOptions.checkExists();

    permissionOptions.set(3);
  }

  checkTheseProjectCustomPermissions(permissionIndices: number[]) {
    permissionIndices.forEach((permissionIndex) => {
      const checkbox = new CheckboxInputPo(`[data-testid="custom-permission-${ permissionIndex }"]`);

      checkbox.checkExists();
      checkbox.set();
    });
  }

  submitProjectCreateButton() {
    return cy.get('[data-testid="card-actions-slot"] button.role-primary').click();
  }

  saveCreateForm(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }

  cancelCreateForm(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-cancel"]', this.self());
  }

  resourcesList() {
    return new BaseResourceList(this.self());
  }

  sortableTable() {
    return this.resourcesList().resourceTable().sortableTable();
  }

  listElementWithName(name:string) {
    return this.sortableTable().rowElementWithName(name);
  }

  projectTable() {
    return new SortableTablePo('#project-membership [data-testid="sortable-table-list-container"]');
  }
}
