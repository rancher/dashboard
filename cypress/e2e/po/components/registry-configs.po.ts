import ComponentPo from '@/cypress/e2e/po/components/component.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import SelectOrCreateAuthPo from '@/cypress/e2e/po/components/select-or-create-auth.po';

export default class RegistyConfigsPo extends ComponentPo {
  registryAuthHost(index: number): LabeledInputPo {
    return new LabeledInputPo(`[data-testid="registry-auth-host-input-${ index }"]`);
  }

  addRegistryAuthHost(index: number, host: string): void {
    this.registryAuthHost(index).set(host);
  }

  authSelectOrCreate(selector: string): SelectOrCreateAuthPo {
    return new SelectOrCreateAuthPo(selector);
  }

  registryAuthSelectOrCreate(index: number): SelectOrCreateAuthPo {
    return this.authSelectOrCreate(
      `[data-testid="registry-auth-select-or-create-${ index }"]`
    );
  }
}
