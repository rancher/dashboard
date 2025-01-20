import ComponentPo from '@/cypress/e2e/po/components/component.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';

export default class CreateEditViewPo extends ComponentPo {
  create() {
    return new AsyncButtonPo(this.self().find('.cru-resource-footer .role-primary')).click();
  }

  save() {
    return new AsyncButtonPo(this.self().find('.cru-resource-footer .role-primary')).click();
  }

  saveAndWait() {
    return new AsyncButtonPo(this.self().find('.cru-resource-footer .role-primary')).action('Save', 'Saved');
  }

  nextPage() {
    return new AsyncButtonPo(this.self().find('.cru-resource-footer .role-primary')).click();
  }

  saveButtonPo() :AsyncButtonPo {
    return new AsyncButtonPo(this.self().find('.cru-resource-footer .role-primary'));
  }

  editAsYaml() {
    return new AsyncButtonPo(this.self().find('[data-testid="form-yaml"]')).click();
  }
}
