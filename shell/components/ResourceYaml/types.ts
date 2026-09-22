/**
 * One resource in the `ResourceGraph` of the multi-resource YAML editor
 */
export interface ResourceGraphNode {
  /** Identifies the node, usually the resource id. Emitted when the node is selected */
  id: string;

  /** Shown as the node's name, for example `workers` */
  label: string;

  /**
   * The heading the node is shown under, for example `Node Pools · Machine Templates`
   *
   * Nodes are grouped in the order they first appear, and those without a group are shown first,
   * without a heading
   */
  group?: string;

  /** Shows an indicator that the resource has unsaved changes */
  modified?: boolean;

  /** The resource can be shown but not edited */
  readOnly?: boolean;

  /**
   * The `id` of the node this one was found below
   *
   * The node is shown in a group nested below that node, rather than alongside it, so a resource
   * that belongs to a related resource is shown as belonging to it. A node with no parent, or one
   * pointing at a node that isn't in the graph, is shown at the top level
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
