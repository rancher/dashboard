import ComponentPo from '@/cypress/e2e/po/components/component.po';
import BannersPo from '@/cypress/e2e/po/components/banners.po';
import CodeMirrorPo from '@/cypress/e2e/po/components/code-mirror.po';
import ResourceGraphPo from '@/cypress/e2e/po/components/resource-graph.po';

/**
 * The multi-resource YAML editor: a resource graph beside the YAML of the resource selected in it
 *
 * Shown in place of the single-resource YAML editor when the resource has related resources
 */
export default class MultiResourceYamlPo extends ComponentPo {
  constructor() {
    super('.multi-yaml-container');
  }

  resourceGraph(): ResourceGraphPo {
    return new ResourceGraphPo();
  }

  /**
   * The editor of the selected resource. Not shown while the diff is
   */
  codeMirror(): CodeMirrorPo {
    return CodeMirrorPo.bySelector(this.self(), '.multi-yaml-editor [data-testid="yaml-editor-code-mirror"]');
  }

  /**
   * Change the YAML of the selected resource
   *
   * @param change given the YAML in the editor, returns the YAML to replace it with
   */
  editYaml(change: (yaml: string) => string): Cypress.Chainable {
    // a new editor po to set the yaml: the chain behind the first one holds the yaml once read
    return this.codeMirror().value().then((yaml: string) => this.codeMirror().set(change(yaml)));
  }

  /**
   * The YAML of the selected resource, as shown in the editor
   */
  yaml(): Cypress.Chainable<string> {
    return this.codeMirror().value();
  }

  /**
   * The editor of the selected resource is read-only, as it is for a referenced resource
   */
  checkReadOnly(readOnly = true): Cypress.Chainable {
    return this.self().find('.multi-yaml-editor .cm-content').should('have.attr', 'contenteditable', String(!readOnly));
  }

  /**
   * The banner a related resource shows while it is selected
   */
  banner(): BannersPo {
    return new BannersPo('.multi-yaml-editor > .banner:not([data-testid="multi-yaml-management-banner"])', this.self());
  }

  /**
   * The banner the editor shows while the selected resource is written by a controller, rancher, fleet or helm
   */
  managementBanner(): BannersPo {
    return new BannersPo('.multi-yaml-editor > [data-testid="multi-yaml-management-banner"]', this.self());
  }

  diffToggle(): Cypress.Chainable {
    return this.self().find('[data-testid="multi-yaml-diff-toggle"]');
  }

  /**
   * The diff of the selected resource against the YAML it was opened with
   */
  diff(): Cypress.Chainable {
    return this.self().find('.multi-yaml-editor #diffElement');
  }

  /**
   * Show the diff as one column, removed lines above added ones
   */
  showUnifiedDiff(): Cypress.Chainable {
    return this.self().find('[data-testid="multi-yaml-diff-mode"] button').eq(0).click();
  }

  /**
   * Show the diff as two columns, the YAML it was opened with beside the edited YAML
   */
  showSplitDiff(): Cypress.Chainable {
    return this.self().find('[data-testid="multi-yaml-diff-mode"] button').eq(1).click();
  }

  checkDiffMode(mode: 'unified' | 'split'): Cypress.Chainable {
    // diff2html renders a side by side diff as `d2h-file-side-diff`, a unified one as `d2h-file-diff`
    return this.diff().find(mode === 'split' ? '.d2h-file-side-diff' : '.d2h-file-diff').should('exist');
  }

  /**
   * Save every edited resource, then leave the editor
   */
  saveAll(): Cypress.Chainable {
    return this.self().find('[data-testid="multi-yaml-save"]');
  }

  cancel(): Cypress.Chainable {
    return this.self().find('[data-testid="multi-yaml-cancel"]');
  }
}
