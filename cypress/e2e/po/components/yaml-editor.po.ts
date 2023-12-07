import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class YamlEditor extends ComponentPo {
  constructor() {
    super('[data-testid="yaml-editor-code-mirror"]');
  }

  set(value: string) {
    this.clear();

    return this.self().find('.CodeMirror')
      .then((editor) => {
        editor[0].CodeMirror.setValue(value);
      });
  }

  clear() {
    return this.self().find('.CodeMirror')
      .then((editor) => {
        editor[0].CodeMirror.setValue('');
      });
  }
}
