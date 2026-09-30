import { EditableResource } from '@shell/core/types';

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

  /**
   * The resource can be shown but not edited
   *
   * The groups of read-only nodes whose parent is not read-only are shown last, below the
   * referenced heading
   */
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

  /**
   * The group holds read-only nodes whose parent is not read-only
   *
   * These groups follow the others, and the referenced heading is shown above the first of them
   */
  readOnly?: boolean;

  nodes: ResourceGraphTreeNode[];
}

/**
 * A type of the related resources shown in the multi-resource YAML editor
 */
export interface RelatedResourceType {
  /** The store name and the type, as two stores can have a type of the same name, for example `secret` */
  key: string;

  type: string;

  label: string;

  /** A resource of this type, whose store holds the type's schema */
  resource: EditableResource;

  /** The related resources of this type, which a new resource can be copied from */
  sources: RelatedResourceCloneSource[];

  /** Saves a new resource of this type from its YAML, with the save hooks and `save` of the first related resource of this type */
  save: (yaml: string) => Promise<EditableResource>;
}

/**
 * A related resource that a new resource can be copied from
 */
export interface RelatedResourceCloneSource {
  /** The `nodeId` of the related resource */
  id: string;

  label: string;

  /** Resolves to the YAML of a new resource copied from this one */
  cloneYaml: () => Promise<string>;
}
