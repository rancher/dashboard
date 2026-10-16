/**
 * One resource in the `ResourceGraph` of the multi-resource YAML editor
 */
export interface ResourceGraphNode {
  /** Usually the resource id */
  id: string;

  // display label for each resource, generally a model's nameDisplay
  label: string;

  /**
   * The heading the node is shown under, eg `Node Pools · Machine Templates`
   */
  group?: string;

  /** Shows that the resource has unsaved changes, and offers to save it */
  modified?: boolean;

  /**
   * Read-only nodes are shown in the read-only section, collapsed by default, grouped by `group`
   * alone, wherever they were found. They are never top-level nodes
   */
  readOnly?: boolean;

  /**
   * The `id` of the node this one was found below. A node with no parent, or one
   * pointing at a node that isn't in the graph, is shown at the top level.
   */
  parentId?: string;
}

/**
 * A `ResourceGraphNode` in its place in the graph, with the groups of nodes found below it
 *
 * Resolved by the `ResourceGraph` itself from the flat list of nodes it is given
 */
export interface ResourceGraphTreeNode extends ResourceGraphNode {
  /** The groups of nodes that sit below this one, empty when nothing does */
  groups: ResourceGraphGroup[];
}

/**
 * `ResourceGraphTreeNode`s sharing a heading and a parent, as resolved by the `ResourceGraph` itself
 */
export interface ResourceGraphGroup {
  /** The heading to show, or an empty string for the ungrouped nodes */
  label: string;

  nodes: ResourceGraphTreeNode[];
}
