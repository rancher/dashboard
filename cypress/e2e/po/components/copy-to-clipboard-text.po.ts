import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class CopyToClipboardTextPo extends ComponentPo {
  value() {
    return this.self().invoke('text');
  }

  copyToClipboard() {
    return this.self().click().wait(800);
  }

  exists() {
    return this.self().should('exist');
  }
}
