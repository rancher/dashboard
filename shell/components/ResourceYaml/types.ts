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
}

/**
 * `ResourceGraphNode`s sharing a heading, as resolved by the `ResourceGraph` itself
 */
export interface ResourceGraphGroup {
  /** The heading to show, or an empty string for the ungrouped nodes */
  label: string;

  nodes: ResourceGraphNode[];
}
