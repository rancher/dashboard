import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import CheckboxInputPo from '~/cypress/e2e/po/components/checkbox-input.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
import ResourceListMastheadPo from '@/cypress/e2e/po/components/ResourceList/resource-list-masthead.po';

export default class UsersAndAuthPo extends PagePo {
  private static createPath(clusterId: string, resource: string) {
    return `/c/${ clusterId }/auth/${ resource }`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = '_', resource = 'management.cattle.io.user') {
    super(UsersAndAuthPo.createPath(clusterId, resource));
  }

  listCreate() {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.masthead().actions().eq(0).click();
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

  name(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Name');
  }

  username(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Username');
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

  authversionGitHub(): RadioGroupInputPo {
    return new RadioGroupInputPo('[data-testid="authConfig-gitHub"]');
  }

  clientId(): LabeledInputPo {
    return new LabeledInputPo('[data-testid="client-id"]', this.self());
  }

  clientSecret(): LabeledInputPo {
    return new LabeledInputPo('[data-testid="client-secret"]', this.self());
  }


  saveCreateForm(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }

  save(): Cypress.Chainable {
    return this.saveCreateForm().click();
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
}
