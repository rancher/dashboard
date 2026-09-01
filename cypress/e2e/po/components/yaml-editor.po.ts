import CodeMirrorPo from '@/cypress/e2e/po/components/code-mirror.po';
import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class YamlEditorPo extends ComponentPo {
  input(): CodeMirrorPo {
    return CodeMirrorPo.bySelector(this.self(), '[data-testid="yaml-editor-code-mirror"]');
  }
}
