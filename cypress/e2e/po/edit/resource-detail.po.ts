import ComponentPo from '@/cypress/e2e/po/components/component.po';
import CreateEditViewPo from '@/cypress/e2e/po/components/create-edit-view.po';
import CruResourcePo from '@/cypress/e2e/po/components/cru-resource.po';
import ResourceYamlPo from '@/cypress/e2e/po/components/resource-yaml.po';

export default class ResourceDetailPo extends ComponentPo {
  /**
   * components for handling CRUD operations for resources, including cancel/save buttons
   * @returns
   */
  cruResource() {
    return new CruResourcePo(this.self());
  }

  /**
   * components for managing the resource creation and edit forms
   * @returns
   */
  createEditView() {
    return new CreateEditViewPo(this.self());
  }

  /**
   * components for YAML editor
   * @returns
   */
  resourceYaml() {
    return new ResourceYamlPo(this.self());
  }

  title(): Cypress.Chainable<string> {
    return this.self().find('.primaryheader h1').invoke('text');
  }
}
