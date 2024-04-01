import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { WorkspaceSwitcherPo } from '@/cypress/e2e/po/components/workspace-switcher.po';
export class HeaderPo extends ComponentPo {
  constructor() {
    super('[data-testid="header"]');
  }

  selectWorkspace(name: string) {
    const wsFilter = new WorkspaceSwitcherPo();

    wsFilter.toggle();

    return wsFilter.clickOptionWithLabel(name);
  }

  clusterIcon() {
    return this.self().find('.cluster-icon');
  }

  clusterName() {
    return this.self().find('.cluster-name');
  }

  customBadge() {
    return this.self().find('.cluster-badge');
  }

  kubectlExplain() {
    return this.self().find('[data-testid="extension-header-action-kubectl-explain.action"]');
  }

  showKubectlExplainTooltip(): Cypress.Chainable {
    return this.kubectlExplain().trigger('mouseenter');
  }

  getKubectlExplainTooltipContent(): Cypress.Chainable {
    return cy.get('.tooltip.vue-tooltip-theme .tooltip-inner');
  }
}
