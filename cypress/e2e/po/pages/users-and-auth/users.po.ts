import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import CheckboxInputPo from '~/cypress/e2e/po/components/checkbox-input.po';
import ResourceListMastheadPo from '@/cypress/e2e/po/components/ResourceList/resource-list-masthead.po';
import { CypressChainable } from '~/cypress/e2e/po/po.types';

export default class UsersPo extends PagePo {
  private static createPath(clusterId: string, resource: string, userId?: string) {
    return (userId ? `/c/${ clusterId }/auth/${ resource }/${ userId }` : `/c/${ clusterId }/auth/${ resource }`);
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = '_', resource = 'management.cattle.io.user', userId?: string) {
    super(UsersPo.createPath(clusterId, resource, userId));
  }

  waitForRequests() {
    UsersPo.goToAndWaitForGet(this.goTo.bind(this), ['/v3/users?limit=0', '/v1/management.cattle.io.users?exclude=metadata.managedFields']);
  }

  listCreate() {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.masthead().actions().eq(0).click();
  }

  listRefreshGroupMembership(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="action-button-async-button"]', this.self());
  }

  listDeactivate() {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.resourceTable().sortableTable().deactivateButton();
  }

  listActivate() {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.resourceTable().sortableTable().activateButton();
  }

  openBulkActionDropdown() {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.resourceTable().sortableTable().bulkActionDropDownOpen();
  }

  bulkActionButton(name: string) {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.resourceTable().sortableTable().bulkActionDropDownButton(name);
  }

  selectAll() {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.resourceTable().sortableTable().selectAllCheckbox();
  }

  listElements() {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.resourceTable().sortableTable().rowElements();
  }

  listElementWithName(name: string) {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.resourceTable().sortableTable().rowElementWithName(name);
  }

  listTitle() {
    const resourceListMasthead = new ResourceListMastheadPo(this.self());

    return resourceListMasthead.title();
  }

  listDetails(name: string, index: number) {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.resourceTable().sortableTable().rowWithName(name).column(index);
  }

  clickRowActionMenuItem(name: string, itemLabel:string) {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.resourceTable().sortableTable().rowActionMenuOpen(name, 7).getMenuItem(itemLabel)
      .click();
  }

  name(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Name');
  }

  username(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Username');
  }

  description(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Description');
  }

  newPass(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'New Password');
  }

  confirmNewPass(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Confirm Password');
  }

  selectCheckbox(label:string): CheckboxInputPo {
    return CheckboxInputPo.byLabel(this.self(), label);
  }

  saveCreateForm(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }

  saveAndWaitForRequests(method: string, url: any, multipleCalls?: boolean): CypressChainable {
    cy.intercept(method, url).as('request');
    this.saveCreateForm().click();

    return (multipleCalls ? cy.wait(['@request', '@request'], { timeout: 10000 }) : cy.wait('@request', { timeout: 10000 }));
  }
}
