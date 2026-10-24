// The types a Table widget can show, from the schemas of wherever it reads: Rancher's own API, or one
// cluster's. Pure functions - no Vue, no store.

/** A schema as Steve serves it - the parts the Resource picker reads. */
export interface TypeSchema {
  id: string;
  collectionMethods?: string[];
  attributes?: {
    kind?: string;
    group?: string;
    verbs?: string[];
  };
}

/** One entry in the Resource picker: a type, or the heading of its API group. */
export interface TypeOption {
  label: string;
  value: string;
  kind?: 'group';
  disabled?: boolean;
}

/** The core API's group has no name of its own. */
const CORE = 'core';

/**
 * Can a list of it be read? A Kubernetes kind whose collection answers a GET, and, where the schema
 * says which verbs it allows, one of them is `list` - some, like a kubeconfig, can only be made.
 */
export function isListable(schema: TypeSchema): boolean {
  const verbs = schema.attributes?.verbs;

  return !!schema.attributes?.kind &&
    (schema.collectionMethods || []).some((method) => `${ method }`.toUpperCase() === 'GET') &&
    (!verbs || verbs.includes('list'));
}

/**
 * The picker's entries: every listable type, under its API group - the core group first, then the
 * others by name - each named by its kind, with its group only when two groups share the kind.
 *
 * `current` is the type the widget already shows. When it is not among them (typed in by hand, or
 * not on this cluster) it leads the list, so the picker never silently drops it.
 */
export function typeOptions(schemas: TypeSchema[], current = ''): TypeOption[] {
  const listable = schemas.filter(isListable);
  const groupOf = (schema: TypeSchema) => schema.attributes?.group || CORE;
  const kindOf = (schema: TypeSchema) => schema.attributes?.kind || schema.id;
  const groupsOfKind = new Map<string, Set<string>>();

  listable.forEach((schema) => {
    const groups = groupsOfKind.get(kindOf(schema)) || new Set<string>();

    groups.add(groupOf(schema));
    groupsOfKind.set(kindOf(schema), groups);
  });

  const byGroup = new Map<string, TypeOption[]>();

  listable.forEach((schema) => {
    const kind = kindOf(schema);
    const group = groupOf(schema);
    const label = (groupsOfKind.get(kind)?.size || 0) > 1 ? `${ kind } (${ group })` : kind;

    byGroup.set(group, [...(byGroup.get(group) || []), { label, value: schema.id }]);
  });

  const groups = [...byGroup.keys()].sort((a, b) => (a === CORE ? -1 : b === CORE ? 1 : a.localeCompare(b)));
  const out: TypeOption[] = current && !listable.some((schema) => schema.id === current) ? [{ label: current, value: current }] : [];

  groups.forEach((group) => {
    out.push({
      kind: 'group', label: group, value: `group:${ group }`, disabled: true
    });
    out.push(...(byGroup.get(group) || []).sort((a, b) => a.label.localeCompare(b.label)));
  });

  return out;
}
