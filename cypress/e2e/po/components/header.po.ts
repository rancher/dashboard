import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { WorkspaceSwitcherPo } from '@/cypress/e2e/po/components/namespace-filter.po';

export class HeaderPo extends ComponentPo {
  constructor() {
    super('[data-testid="header"]');
  }

  selectWorkspace(name: string) {
    const wsFilter = new WorkspaceSwitcherPo();

    wsFilter.toggle();

    return wsFilter.clickOptionWithLabel(name);
  }
}
