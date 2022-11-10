import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';

export default class ResourceYamlPo extends ComponentPo {
  constructor(parent: CypressChainable) {
    super(parent.find('.resource-yaml'));
  }
}
