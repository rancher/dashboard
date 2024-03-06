import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import ComponentPo from '@/cypress/e2e/po/components/component.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';

export default class SelectOrCreateAuthPo extends ComponentPo {
  authSelect() {
    return new LabeledSelectPo(`${ this.selector } [data-testid="auth-secret-select"]`, this.self());
  }

  setAuthSecret(secretType: string, username: string, password: string) {
    const privateKey = new LabeledInputPo(`${ this.selector } [data-testid="auth-secret-${ secretType }-private-key"]`, this.self());
    const publicKey = new LabeledInputPo(`${ this.selector } [data-testid="auth-secret-${ secretType }-public-key"]`, this.self());

    privateKey.set(username);
    publicKey.set(password);
  }

  createBasicAuth(username = 'auth-test-user', password = 'auth-test-password') {
    this.authSelect().toggle();
    this.authSelect().clickOptionWithLabel('Create a HTTP Basic Auth Secret');
    this.setAuthSecret('basic', username, password);
  }

  createSSHAuth(privateKey: string, publicKey: string) {
    this.authSelect().toggle();
    this.authSelect().clickOptionWithLabel('Create a SSH Key Secret');
    this.setAuthSecret('ssh', privateKey, publicKey);
  }
}
