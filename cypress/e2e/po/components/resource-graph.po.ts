import ComponentPo from '@/cypress/e2e/po/components/component.po';

/**
 * The key the graph gives a resource: its type and id together, as an id alone (`namespace/name`)
 * can be shared by resources of different types
 */
const nodeKey = (type: string, id: string) => `${ type }:${ id }`;

/**
 * One resource in the resource graph of the multi-resource YAML editor
 */
export class ResourceGraphNodePo extends ComponentPo {
  /**
   * @param graph the graph holding the node
   * @param type the steve type of the resource
   * @param id the steve id of the resource, `namespace/name` for a namespaced type
   */
  constructor(graph: ResourceGraphPo, type: string, id: string) {
    // the row of the node: its select button, modified badge and save button
    // one query, so `checkNotExists` can pass: a chained `.find` would require the select button to exist
    super(() => graph.self().find(`.resource-graph-node:has([data-testid="resource-graph-node-${ nodeKey(type, id) }"])`));
  }

  label(): Cypress.Chainable {
    return this.self().find('.resource-graph-node-label');
  }

  /**
   * Show the YAML of the resource in the editor
   */
  select(): Cypress.Chainable {
    return this.self().find('.resource-graph-node-select').click();
  }

  checkSelected(selected = true): Cypress.Chainable {
    return this.self().should(selected ? 'have.class' : 'not.have.class', 'resource-graph-node--selected');
  }

  checkReadOnly(readOnly = true): Cypress.Chainable {
    return this.self().should(readOnly ? 'have.class' : 'not.have.class', 'resource-graph-node--read-only');
  }

  /**
   * The badge shown while the resource has unsaved changes
   */
  modifiedBadge(): Cypress.Chainable {
    return this.self().find('.resource-graph-node-modified');
  }

  checkModified(modified = true): Cypress.Chainable {
    return this.self().should(modified ? 'have.class' : 'not.have.class', 'resource-graph-node--modified');
  }

  /**
   * The button saving this resource alone, shown while it has unsaved changes and is not read-only
   */
  saveButton(): Cypress.Chainable {
    return this.self().find('.resource-graph-node-save');
  }

  save(): Cypress.Chainable {
    return this.saveButton().click();
  }

  /**
   * The labels of the resources nested below this one, at every depth
   */
  nestedLabels(): Cypress.Chainable {
    return this.self().parent().children('.resource-graph-groups--nested').find('.resource-graph-node-label');
  }

  /**
   * The headings of the groups nested directly below this one
   */
  nestedGroupLabels(): Cypress.Chainable {
    return this.self().parent().children('.resource-graph-groups--nested').children('.resource-graph-group')
      .children('.resource-graph-group-label');
  }
}

/**
 * A collapsible section of the resource graph: the related resources, or the referenced read-only
 * resources
 */
export class ResourceGraphSectionPo extends ComponentPo {
  title(): Cypress.Chainable {
    return this.self().find('.resource-graph-section-title');
  }

  toggle(): Cypress.Chainable {
    return this.self().find('[data-testid="resource-graph-section-toggle"]').click();
  }

  checkExpanded(expanded = true): Cypress.Chainable {
    return this.self().find('[data-testid="resource-graph-section-toggle"]').should('have.attr', 'aria-expanded', String(expanded));
  }

  /**
   * The labels of the resources shown in the section, at every depth, in the order shown
   */
  nodeLabels(): Cypress.Chainable {
    return this.self().find('.resource-graph-node-label');
  }

  /**
   * The headings of the groups shown in the section, at every depth
   */
  groupLabels(): Cypress.Chainable {
    return this.self().find('.resource-graph-group-label');
  }
}

/**
 * The resource graph of the multi-resource YAML editor, listing the primary resource and the
 * resources related to it
 */
export default class ResourceGraphPo extends ComponentPo {
  constructor() {
    super('.multi-yaml-container .resource-graph');
  }

  /**
   * The number of resources in the graph, those in collapsed sections included
   */
  count(): Cypress.Chainable {
    return this.self().find('[data-testid="resource-graph-count"]');
  }

  /**
   * The labels of the top-level resources, shown above the sections
   */
  topLevelLabels(): Cypress.Chainable {
    return this.self().find('.resource-graph-body > .resource-graph-groups > .resource-graph-group .resource-graph-node-label');
  }

  /**
   * The labels of every resource shown, in the order shown
   */
  nodeLabels(): Cypress.Chainable {
    return this.self().find('.resource-graph-node-label');
  }

  /**
   * @param type the steve type of the resource
   * @param id the steve id of the resource, `namespace/name` for a namespaced type
   */
  node(type: string, id: string): ResourceGraphNodePo {
    return new ResourceGraphNodePo(this, type, id);
  }

  /**
   * How many times a resource is shown, at least once
   *
   * @param type the steve type of the resource
   * @param id the steve id of the resource, `namespace/name` for a namespaced type
   */
  nodeCount(type: string, id: string): Cypress.Chainable<number> {
    return this.self().find(`[data-testid="resource-graph-node-${ nodeKey(type, id) }"]`).its('length');
  }

  /**
   * The section listing the resources related to the top-level resources
   */
  relatedSection(): ResourceGraphSectionPo {
    return new ResourceGraphSectionPo(() => this.self().find('[data-testid="resource-graph-related"]'));
  }

  /**
   * The section listing the read-only resources referenced by the top-level resources
   */
  referencedSection(): ResourceGraphSectionPo {
    return new ResourceGraphSectionPo(() => this.self().find('[data-testid="resource-graph-referenced"]'));
  }
}
