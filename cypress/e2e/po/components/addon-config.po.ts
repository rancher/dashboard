import ComponentPo from '@/cypress/e2e/po/components/component.po';
import YamlEditorPo from '~/cypress/e2e/po/components/yaml-editor.po';

export default class AddonConfigPo extends ComponentPo {
  constructor(selector = '.dashboard-root') {
    super(selector);
  }

  yamlEditor() :YamlEditorPo {
    return new YamlEditorPo(this.self().find('[data-testid="addon-yaml-editor"]'));
  }
}
