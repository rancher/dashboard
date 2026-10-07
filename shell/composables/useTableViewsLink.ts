/**
 * Keeps the page's URL showing what its tables show, and hands each table the view a link was sent
 * with. Every table on the page writes to the same parameter, so the tables are gathered here
 */
import { getCurrentInstance, onBeforeUnmount } from 'vue';
import type { Router } from 'vue-router';
import { useStore } from 'vuex';

import { TABLE_VIEWS_QUERY, TABLE_VIEWS_USER_QUERY } from '@shell/config/query-params';
import { encodeLinkedViews, sharedViewsIn } from '@shell/utils/table-views/link';
import type { LinkedTableView } from '@shell/utils/table-views/link';

/** Typing in the filter changes the view per key; the URL follows once it settles */
const WRITE_DELAY = 300;

/** What each table on the page shows, by table */
const shown = new Map<string, LinkedTableView>();

/**
 * The views a link was sent with that no table has taken yet. Kept here as the first write replaces
 * the URL they came in, and a table can open after it
 */
let unclaimed: { path: string, tables: Record<string, LinkedTableView> } | null = null;

let router: Router | null = null;

let me: string | null = null;

let writeTimer: ReturnType<typeof setTimeout> | undefined;

function write() {
  const route = router?.currentRoute.value;

  if (!router || !route) {
    return;
  }

  const query = { ...route.query };

  if (shown.size && me) {
    query[TABLE_VIEWS_QUERY] = encodeLinkedViews({ user: me, tables: Object.fromEntries(shown) });
    query[TABLE_VIEWS_USER_QUERY] = me;
  } else {
    delete query[TABLE_VIEWS_QUERY];
    delete query[TABLE_VIEWS_USER_QUERY];
  }

  if (query[TABLE_VIEWS_QUERY] === route.query[TABLE_VIEWS_QUERY] && query[TABLE_VIEWS_USER_QUERY] === route.query[TABLE_VIEWS_USER_QUERY]) {
    return;
  }

  router.replace({
    path: route.path, query, hash: route.hash
  });
}

function scheduleWrite() {
  clearTimeout(writeTimer);
  writeTimer = setTimeout(write, WRITE_DELAY);
}

/** `tableKey` is the table's key in the link - see linkedTableKey */
export function useTableViewsLink(tableKey: () => string) {
  const store = useStore();

  router = getCurrentInstance()?.proxy?.$router || router;
  me = store.getters['auth/user']?.id || null;

  let ownKey: string | null = null;

  /** The view this table was sent, once: a link of one's own sends none */
  const takeShared = (): LinkedTableView | null => {
    const route = router?.currentRoute.value;
    const key = tableKey();

    if (!route || !key) {
      return null;
    }

    if (unclaimed?.path !== route.path) {
      const tables = sharedViewsIn(route.query, me);

      unclaimed = tables ? { path: route.path, tables: { ...tables } } : null;
    }

    const view = unclaimed?.tables[key] || null;

    if (unclaimed) {
      delete unclaimed.tables[key];
    }

    return view;
  };

  /** What the table shows now, or null when it shows nothing worth sending */
  const show = (view: LinkedTableView | null) => {
    const key = tableKey();

    if (!key) {
      return;
    }

    if (ownKey && ownKey !== key) {
      shown.delete(ownKey);
    }

    ownKey = key;

    if (view) {
      shown.set(key, view);
    } else {
      shown.delete(key);
    }

    scheduleWrite();
  };

  onBeforeUnmount(() => {
    if (ownKey) {
      shown.delete(ownKey);
      scheduleWrite();
    }
  });

  return { takeShared, show };
}
