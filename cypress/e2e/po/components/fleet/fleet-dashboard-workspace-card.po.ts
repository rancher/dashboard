import { CypressChainable } from '@/cypress/e2e/po/po.types';
import ButtonGroupPo from '@/cypress/e2e/po/components/button-group.po';
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

  constructor(selector: string, parent: CypressChainable, workspace: string) {
    super(selector, parent);

    this.workspace = workspace;
  }

  gitReposFilter() {
    return CheckboxInputPo.byLabel(this.self(), 'Show Git Repos');
  }

  helmOpsFilter() {
    return CheckboxInputPo.byLabel(this.self(), 'Show Helm Ops');
  }

  viewModeButton() {
    return new ButtonGroupPo('[data-testid="view-button"]', this.self());
  }

  statePanel(stateDisplay) {
    return new StatePanelPo(`[data-testid="state-panel-${ stateDisplay }"]`, this.self(), this.workspace);
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

  resourcePanel(type: 'git-repos' | 'helm-ops' | 'clusters' | 'cluster-groups') {
    return new ResourcePanelPo(`[data-testid="resource-panel-${ type }"]`, this.self());
  }

  expandButton() {
    return this.self().find('[data-testid="expand-button"]');
  }

  cardsPanel() {
    return new CardsPanelPo('[data-testid="expanded-panel"] .cards-panel', this.self(), this.workspace);
  }

  tablePanel() {
    return null;
  }
}
