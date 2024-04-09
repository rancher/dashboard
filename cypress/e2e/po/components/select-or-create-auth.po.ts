import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import ComponentPo from '@/cypress/e2e/po/components/component.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';

export default class SelectOrCreateAuthPo extends ComponentPo {
  authSelect() {
    return new LabeledSelectPo(`${ this.selector } [data-testid="auth-secret-select"]`, this.self());
  }

  loading() {
    return this.self().get(`${ this.selector } i.icon-spinner`);
  }

  setBasicAuthSecret(username: string, password: string) {
    const usernameInput = new LabeledInputPo(`${ this.selector } [data-testid="auth-secret-basic-username"]`, this.self());
    const passwordInput = new LabeledInputPo(`${ this.selector } [data-testid="auth-secret-basic-password"]`, this.self());

    usernameInput.set(username);
    passwordInput.set(password);
  }

  setSSHSecret(privateKey: string, publicKey: string) {
    const privateKeyInput = new LabeledInputPo(`${ this.selector } [data-testid="auth-secret-ssh-private-key"]`, this.self());
    const publicKeyInput = new LabeledInputPo(`${ this.selector } [data-testid="auth-secret-ssh-public-key"]`, this.self());

    privateKeyInput.set(privateKey);
    publicKeyInput.set(publicKey);
  }

  createBasicAuth(username = 'auth-test-user', password = 'auth-test-password') {
    this.authSelect().toggle();
    this.authSelect().clickOptionWithLabel('Create a HTTP Basic Auth Secret');
    this.setBasicAuthSecret(username, password);
  }

  createSSHAuth(privateKey: string, publicKey: string) {
    this.authSelect().toggle();
    this.authSelect().clickOptionWithLabel('Create a SSH Key Secret');
    this.setSSHSecret(privateKey, publicKey);
  }
}
