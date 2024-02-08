import ComponentPo from '@/cypress/e2e/po/components/component.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import SelectOrCreateAuthPo from '@/cypress/e2e/po/components/select-or-create-auth.po';

export default class RegistriesRke2 extends ComponentPo {
  constructor(selector = '.dashboard-root') {
    super(selector);
  }

  enableRegistryCheckbox() {
    return new CheckboxInputPo('[data-testid="registries-enable-checkbox"]');
  }

  clickShowAdvanced() {
    this.self().find('[data-testid="registries-advanced-section"]').click();
  }

  registryHostInput() {
    return new LabeledInputPo('[data-testid="registry-host-input"]');
  }

  addRegistryHost(host: string) {
    this.registryHostInput().set(host);
  }

  registryAuthHost(index: number) {
    return new LabeledInputPo(`[data-testid="registry-auth-host-input-${index}"]`);
  }

  addRegistryAuthHost(index: number, host: string) {
    this.registryAuthHost(index).set(host);
  }

  authSelectOrCreate(selector: string) {
    return new SelectOrCreateAuthPo(selector);
  }

  registryAuthSelectOrCreate(index: number) {
    return this.authSelectOrCreate(
      `[data-testid="registry-auth-select-or-create-${index}"]`
    );
  }
}
