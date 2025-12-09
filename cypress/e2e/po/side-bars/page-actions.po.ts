import ActionMenuPo from '@/cypress/e2e/po/components/action-menu.po';

// cheat, it's not really an action menu but everyone seems to be copy pasting, why don't i??
export default class HeaderPageActionPo extends ActionMenuPo {
  open() {
    return HeaderPageActionPo.open('[data-testid="page-actions-menu-action-button"]');
  }
}
