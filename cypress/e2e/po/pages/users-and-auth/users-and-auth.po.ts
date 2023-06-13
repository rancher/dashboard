import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import CheckboxInputPo from '~/cypress/e2e/po/components/checkbox-input.po';
import ResourceListMastheadPo from '@/cypress/e2e/po/components/ResourceList/resource-list-masthead.po';

export default class UsersAndAuthPo extends PagePo {
  static url: string = '/c/_/auth/management.cattle.io.user'

  static goTo(): Cypress.Chainable {
    return super.goTo(UsersAndAuthPo.url);
  }

  constructor(url: string) {
    super(url || UsersAndAuthPo.url);
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

  saveCreateForm(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
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
