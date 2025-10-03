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
    return this.self().find(`.badge.bg-${ state }`);
  }
}

class ExpandedPanelPo extends ComponentPo {
  workspace: string;

  constructor(parent: CypressChainable, workspace: string) {
    super(`[data-testid="fleet-dashboard-expanded-panel-${ workspace }"]`, parent);

    this.workspace = workspace;
  }

  cardsPanel() {
    return new CardPanelPo(this.self(), this.workspace);
  }

  tablePanel() {
    return new TablePanelPo(this.self(), this.workspace);
  }

  gitReposFilter() {
    return CheckboxInputPo.byLabel(this.self(), 'Show Git Repos');
  }

  helmOpsFilter() {
    return CheckboxInputPo.byLabel(this.self(), 'Show Helm Ops');
  }
}

class CardPanelPo extends ComponentPo {
  workspace: string;

  constructor(parent: CypressChainable, workspace: string) {
    super('.cards-panel', parent);

    this.workspace = workspace;
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
    return this.self().find('.title .state-title');
  }

  card(name: string) {
    return this.self().find(`[data-testid="item-card-header-title"]`).contains(name);
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

  expandedPanel() {
    return new ExpandedPanelPo(this.self(), this.workspace);
  }

  expandButton() {
    return this.self().find(`[data-testid="workspace-expand-btn-${ this.workspace }"]`);
  }
}
