import { CypressChainable } from '@/cypress/e2e/po/po.types';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import ComponentPo from '@/cypress/e2e/po/components/component.po';

class ResourcePanelPo extends ComponentPo {
  chart() {
    return this.self().find('[data-testid="chart-container"] .chart');
  }

  description() {
    return this.self().find('[data-testid="description"]');
  }

  stateBadge(state: string) {
    return this.self().find(`.bg-${ state }`);
  }
}

class CardsPanelPo extends ComponentPo {
  workspace: string;

  constructor(parent: CypressChainable, workspace: string) {
    super(`[data-testid="fleet-dashboard-expanded-panel-${ workspace }"] .cards-panel`, parent);

    this.workspace = workspace;
  }

  gitReposFilter() {
    return CheckboxInputPo.byLabel(this.self(), 'Show Git Repos');
  }

  helmOpsFilter() {
    return CheckboxInputPo.byLabel(this.self(), 'Show Helm Ops');
  }

  statePanel(stateDisplay) {
    return new StatePanelPo(`[data-testid="state-panel-${ stateDisplay }"]`, this.self(), this.workspace);
  }
}

class TablePanelPo extends ComponentPo {
  workspace: string;

  constructor(parent: CypressChainable, workspace: string) {
    super(`[data-testid="fleet-dashboard-expanded-panel-${ workspace }"] .table-panel`, parent);

    this.workspace = workspace;
  }
}

class StatePanelPo extends ComponentPo {
  workspace: string;

  constructor(selector: string, parent: CypressChainable, workspace: string) {
    super(selector, parent);

    this.workspace = workspace;
  }

  title() {
    return this.self().find(`.title .label`);
  }

  card(name) {
    return this.self().find(`[data-testid="card-${ this.workspace }/${ name }"]`);
  }
}

export default class FleetDashboardWorkspaceCardPo extends ComponentPo {
  workspace: string

  constructor(workspace) {
    super(`[data-testid="fleet-dashboard-workspace-card-${ workspace }"]` );

    this.workspace = workspace;
  }

  resourcePanel(type: 'applications' | 'clusters' | 'cluster-groups') {
    return new ResourcePanelPo(`[data-testid="resource-panel-${ type }"]`, this.self());
  }

  expandButton() {
    return this.self().find('[data-testid="expand-button"]');
  }

  cardsPanel() {
    return new CardsPanelPo(this.self(), this.workspace);
  }

  tablePanel() {
    return new TablePanelPo(this.self(), this.workspace);
  }
}
