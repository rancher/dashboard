import ComponentPo from '@/cypress/e2e/po/components/component.po';
import CreateEditViewPo from '@/cypress/e2e/po/components/create-edit-view.po';
import CruResourcePo from '@/cypress/e2e/po/components/cru-resource.po';
import ResourceYamlPo from '@/cypress/e2e/po/components/resource-yaml.po';

export default class ResourceDetailPo extends ComponentPo {
  cruResource() {
    return new CruResourcePo(this.self());
  }

  createEditView() {
    return new CreateEditViewPo(this.self());
  }

  resourceYaml() {
    return new ResourceYamlPo(this.self());
  }
}
