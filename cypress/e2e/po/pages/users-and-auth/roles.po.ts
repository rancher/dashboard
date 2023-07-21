import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import CheckboxInputPo from '~/cypress/e2e/po/components/checkbox-input.po';
import ResourceListMastheadPo from '@/cypress/e2e/po/components/ResourceList/resource-list-masthead.po';
import { CypressChainable } from '~/cypress/e2e/po/po.types';
import RadioGroupInputPo from '~/cypress/e2e/po/components/radio-group-input.po';

export default class RolesPo extends PagePo {
  private static createPath(clusterId: string, resource: string, roleId?: string) {
    return (roleId ? `/c/${ clusterId }/auth/roles/${ resource }/${ roleId }` : `/c/${ clusterId }/auth/roles${ resource }`);
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = '_', resource: string, roleId?: string) {
    super(RolesPo.createPath(clusterId, resource, roleId));
  }

  waitForRequests() {
    RolesPo.goToAndWaitForGet(this.goTo.bind(this), ['/v1/management.cattle.io.roletemplates?exclude=metadata.managedFields']);
  }

  listCreate(label: string) {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.masthead().actions().contains(label)
      .click();
  }

  listDownloadYaml() {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.resourceTable().sortableTable().downloadYamlButton().first();
  }

  listDelete() {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.resourceTable().sortableTable().deleteButton().first();
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

  description(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Description');
  }

  selectCheckbox(label:string): CheckboxInputPo {
    return CheckboxInputPo.byLabel(this.self(), label);
  }

  saveCreateForm(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }

  saveAndWaitForRequests(method: string, url: any): CypressChainable {
    cy.intercept(method, url).as('request');
    this.saveCreateForm().click();

    return cy.wait('@request', { timeout: 10000 });
  }

  selectVerbs(itemRow: number, optionIndex: number) {
    const selectVerb = new LabeledSelectPo(`[data-testid="grant-resources-verbs${ itemRow }"]`, this.self());

    selectVerb.toggle();
    selectVerb.clickOption(optionIndex);
  }

  selectResourcesByLabelValue(itemRow: number, label: string) {
    const selectResources = new LabeledSelectPo(`[data-testid="grant-resources-resources${ itemRow }"]`, this.self());

    selectResources.toggle();
    selectResources.clickOptionWithLabel(label);
  }

  selectCreatorDefaultRadioBtn(optionIndex: number): CypressChainable {
    const selectRadio = new RadioGroupInputPo('[data-testid="roletemplate-creator-default-options"] div > .radio-container', this.self());

    return selectRadio.set(optionIndex);
  }

  selectLockedRadioBtn(optionIndex: number): CypressChainable {
    const selectRadio = new RadioGroupInputPo('[data-testid="roletemplate-locked-options"] div > .radio-container', this.self());

    return selectRadio.set(optionIndex);
  }
}
