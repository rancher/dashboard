import ComponentPo from '@/cypress/e2e/po/components/component.po';
import RegistyConfigsPo from '@/cypress/e2e/po/components/registry-configs.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import SelectOrCreateAuthPo from '@/cypress/e2e/po/components/select-or-create-auth.po';

export default class RegistriesTabPo extends ComponentPo {
  constructor(selector = '.dashboard-root') {
    super(selector);
  }

  enableRegistryCheckbox(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid="registries-enable-checkbox"]');
  }

  clickShowAdvanced(): void {
    this.self().find('[data-testid="registries-advanced-section"]').click();
  }

  advancedToggle() {
    return this.self().find('[data-testid="registries-advanced-section"]');
  }

  registryHostInput(): LabeledInputPo {
    return new LabeledInputPo('[data-testid="registry-host-input"]');
  }

  addRegistryHost(host: string): void {
    this.registryHostInput().set(host);
  }

  registryConfigs(): RegistyConfigsPo {
    return new RegistyConfigsPo(this.self());
  }

  registryAuthSelector(): SelectOrCreateAuthPo {
    return new SelectOrCreateAuthPo('.select-or-create-auth-secret');
  }
}
