import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import ComponentPo from '@/cypress/e2e/po/components/component.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import KnownHostsEditDialog from '@/cypress/e2e/po/prompts/KnownHostsEditDialog.po';

export default class SelectOrCreateAuthPo extends ComponentPo {
  authSelect() {
    return new LabeledSelectPo(`${ this.selector } [data-testid="auth-secret-select"]`, this.self());
  }

  loading() {
    return this.self().get(`${ this.selector } i.icon-spinner`);
  }

  openKnowHostsEditDialog() {
    return this.self().find('[data-testid="input-known-ssh-hosts_open-dialog"]').click({ force: true });
  }

  setBasicAuthSecret(username: string, password: string) {
    const usernameInput = new LabeledInputPo(`${ this.selector } [data-testid="auth-secret-basic-username"]`, this.self());
    const passwordInput = new LabeledInputPo(`${ this.selector } [data-testid="auth-secret-basic-password"]`, this.self());

    usernameInput.set(username);
    passwordInput.set(password);
  }

  setSSHSecret(privateKey: string, publicKey: string, knownHosts?: string) {
    const privateKeyInput = new LabeledInputPo(`${ this.selector } [data-testid="auth-secret-ssh-private-key"]`, this.self());
    const publicKeyInput = new LabeledInputPo(`${ this.selector } [data-testid="auth-secret-ssh-public-key"]`, this.self());

    privateKeyInput.set(privateKey);
    publicKeyInput.set(publicKey);

    if (knownHosts) {
      this.openKnowHostsEditDialog();

      const knownHostsEditDialog = new KnownHostsEditDialog();

      knownHostsEditDialog.set(knownHosts);
      knownHostsEditDialog.save();
    }
  }

  createBasicAuth(username = 'auth-test-user', password = 'auth-test-password') {
    this.authSelect().toggle();
    this.authSelect().clickOptionWithLabel('Create an HTTP Basic Auth Secret');
    this.setBasicAuthSecret(username, password);
  }

  createSSHAuth(privateKey: string, publicKey: string, knownHosts?: string) {
    this.authSelect().toggle();
    this.authSelect().clickOptionWithLabel('Create an SSH Key Secret');
    this.setSSHSecret(privateKey, publicKey, knownHosts);
  }

  createRKEAuth(username = 'auth-test-user', password = 'auth-test-password') {
    this.authSelect().toggle();
    this.authSelect().clickOptionWithLabel('Create an RKE Auth Config Secret');
    this.authSelect().self().scrollIntoView();
    this.setBasicAuthSecret(username, password);
  }
}
