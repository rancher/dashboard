import SelectPo from '@/cypress/e2e/po/components/select.po';

export class WorkspaceSwitcherPo extends SelectPo {
  constructor() {
    super('[data-testid="workspace-switcher"]');
  }
}
