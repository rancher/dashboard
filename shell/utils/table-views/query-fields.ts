import { get } from '@shell/utils/object';
import { MANAGEMENT } from '@shell/config/types';
import { PINNED_CLUSTERS } from '@shell/store/prefs';
import type {
  TableViewField, TableViewGroup, TableViewQuery, TableViewTerm, TableViewValueSuggestion
} from '@shell/types/table-views';

/** A value no row holds, so a term on it matches nothing, in the page or at the api */
export const NO_MATCH = '__none__';

/**
 * Terms on fields that stand for others, eg `pinned:true`, swapped for the terms they stand for. A
 * group's terms on one such field go together, as they combine with each other
 */
export function expandQuery(query: TableViewQuery, fields: TableViewField[]): TableViewQuery {
  const expanders = fields.filter((field) => typeof field.expand === 'function');

  if (!expanders.length) {
    return query;
  }

  const expandGroup = (group: TableViewGroup): TableViewGroup => {
    const out: TableViewTerm[] = [];
    const done: string[] = [];

    group.forEach((term) => {
      const field = term.field ? expanders.find((f) => f.id === term.field) : undefined;

      if (!field?.expand) {
        out.push(term);
      } else if (!done.includes(field.id)) {
        done.push(field.id);
        out.push(...field.expand(group.filter((t) => t.field === field.id)));
      }
    });

    return out;
  };

  return { clauses: (query?.clauses || []).map((clause) => ({ groups: clause.groups.map(expandGroup) })) };
}

export interface PinnedFieldsOptions {
  label: string;
  idLabel: string;
  /** The pinned clusters' management ids */
  pinnedIds: () => string[];
  /** Where a row holds its management cluster's id */
  idPath: string;
  /** The same, for the api to filter on. None when the list isn't filtered server side */
  serverPath?: string;
  /** How many of the list's clusters are pinned, when the page knows better than the pin list */
  pinnedCount?: number;
  /** Every cluster in the list, pinned or not */
  total?: number;
}

export const PINNED_FIELD_ID = 'pinned';

export const CLUSTER_ID_FIELD_ID = 'clusterid';

/**
 * `pinned:true` and `pinned:false` for a list of clusters. Pinned isn't a column, so the term is
 * swapped for the pinned clusters' ids: any of them, or none of them
 */
export function pinnedQueryFields({
  label, idLabel, pinnedIds, idPath, serverPath, pinnedCount, total
}: PinnedFieldsOptions): TableViewField[] {
  const idField: TableViewField = {
    id:               CLUSTER_ID_FIELD_ID,
    label:            idLabel,
    isLabel:          false,
    queryOnly:        true,
    exact:            true,
    header:           { name: CLUSTER_ID_FIELD_ID, value: idPath },
    paginationHeader: serverPath ? { name: CLUSTER_ID_FIELD_ID, search: serverPath } : undefined,
  };
  const pinned = pinnedCount ?? pinnedIds().length;
  const values: TableViewValueSuggestion[] = [
    { value: 'true', count: pinned },
    { value: 'false', count: typeof total === 'number' ? Math.max(total - pinned, 0) : 0 },
  ];

  const pinnedField: TableViewField = {
    id:        PINNED_FIELD_ID,
    label,
    isLabel:   false,
    queryOnly: true,
    values,
    expand:    (terms: TableViewTerm[]) => {
      // As any field's terms: the values asked for are any of them, those left out are none of them.
      // A half typed value says nothing yet
      const said = terms.map((term) => ({ ...term, value: term.value.trim().toLowerCase() })).filter((term) => term.value === 'true' || term.value === 'false');

      if (!said.length) {
        return [];
      }

      const asked = said.filter((term) => !term.negated).map((term) => term.value);
      const allowed = (asked.length ? asked : ['true', 'false']).filter((value) => !said.some((term) => term.negated && term.value === value));
      const ids = pinnedIds();

      if (allowed.length === 2) {
        return [];
      }

      if (allowed[0] === 'true' && ids.length) {
        return ids.map((id) => ({
          field: CLUSTER_ID_FIELD_ID, value: id, negated: false
        }));
      }

      if (allowed[0] === 'false') {
        return ids.map((id) => ({
          field: CLUSTER_ID_FIELD_ID, value: id, negated: true
        }));
      }

      // Pinned with nothing pinned, or both ruled out
      return [{
        field: CLUSTER_ID_FIELD_ID, value: NO_MATCH, negated: false
      }];
    },
  };

  return [pinnedField, idField];
}

interface PinnableCluster {
  pinned?: boolean;
  isLocal?: boolean;
}

interface ClusterPinStore {
  getters: Record<string, any>;
}

/**
 * The pinned fields for a list of clusters, read from the user's pins. `local` can't be pinned
 * whatever the pin list says. The counts come from the clusters on hand, since the pin list keeps
 * the ids of clusters that have gone: the list's own `rows` when given, else the management clusters
 */
export function clusterPinnedQueryFields(store: ClusterPinStore, t: (key: string) => string, {
  idPath, serverPath, total, rows
}: { idPath: string, serverPath?: string, total?: number, rows?: Record<string, unknown>[] }): TableViewField[] {
  const pinnedIds = () => (store.getters['prefs/get'](PINNED_CLUSTERS) || []).filter((id: string) => id !== 'local');
  let pinnedCount: number;
  let clusterCount: number;

  if (rows) {
    const ids = pinnedIds();

    pinnedCount = rows.filter((row) => ids.includes(get(row, idPath))).length;
    clusterCount = rows.length;
  } else {
    const clusters: PinnableCluster[] = store.getters['management/all'](MANAGEMENT.CLUSTER) || [];

    pinnedCount = clusters.filter((cluster) => cluster.pinned && !cluster.isLocal).length;
    clusterCount = clusters.length;
  }

  return pinnedQueryFields({
    label:   t('tableViews.query.fields.pinned'),
    idLabel: t('tableViews.query.fields.clusterId'),
    pinnedIds,
    idPath,
    serverPath,
    pinnedCount,
    total:   typeof total === 'number' ? total : clusterCount,
  });
}
