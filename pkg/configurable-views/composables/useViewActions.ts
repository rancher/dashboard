import { onBeforeUnmount, ref, type Ref } from 'vue';
import type { Store } from 'vuex';
import type { I18n } from '@shell/composables/useI18n';
import { saveView, fetchTemplatingConfigMaps, type PageKey } from '../templating/template-engine';
import {
  newId, newLayoutView, isStockView, BUILT_IN_STOCK_ID, orderKeyOf
} from '../templating/view-model';
import { stockWidgets, stockView } from '../templating/stock-layouts';
import { clone, type ViewSetState } from './useViewSet';
import type { ConfirmOptions } from './useConfirm';
import type { View, ViewSet } from '../templating/types';

/** What the actions ask of the bar: to bring a tab into sight, and to open one's name for typing. */
interface BarControls {
  focusTab(id: string, toEnd?: boolean): void;
  openRename(id: string): void;
}

/** Longer than a growl's usual 5s: it is the only way back */
const UNDO_TIMEOUT = 10000;

/**
 * The bar's actions on a view, from its menu: rename, duplicate, make it your default, reorder,
 * publish, unpublish and delete - each written straight through (there is no draft outside the
 * editor). A delete is done at once and offered back for a while.
 */
export function useViewActions(
  vs: ViewSetState,
  props: { page: PageKey; title: string },
  store: Store<unknown>,
  t: I18n['t'],
  confirm: (options: ConfirmOptions) => Promise<boolean>,
  bar: Ref<BarControls | null>,
  leaveEdit: () => Promise<void>,
) {
  const {
    editing, activeViewId, pinnedView, saving, error, userId, scopes, orgIds, views,
  } = vs;

  // Renamed in place on its tab.
  async function renameStoredView(id: string, name: string): Promise<void> {
    const view = vs.viewById(id);

    if (!view || isStockView(view)) {
      return;
    }

    const draft = vs.userDraft();
    const ownId = vs.ownCopy(draft, view);
    const mine = draft.views.find((p) => p.id === ownId);

    if (mine) {
      mine.name = name;
    }

    await vs.persist(draft, activeViewId.value === id ? ownId : activeViewId.value);
  }

  // The copy lands in front of you with its name open for typing, as a copied table view does.
  async function duplicateView(id: string): Promise<void> {
    const source = vs.viewById(id);

    if (!source) {
      return;
    }

    const draft = vs.userDraft();
    const name = t('configurableViews.page.copyName', { name: source.name }, true);
    // A copy of Rancher's own page is the page rebuilt from widgets, so there is something to change
    const copy: View = isStockView(source) ? {
      ...newLayoutView(name), ...stockView(props.page), widgets: stockWidgets(props.page, t)
    } : {
      ...clone(source), id: newId('view'), name
    };

    delete copy.org;
    delete copy.from;
    draft.views.push(copy);

    await vs.persist(draft, copy.id);
    bar.value?.focusTab(copy.id, true);
    bar.value?.openRename(copy.id);
  }

  // Your default is the view the page opens on. Picking Rancher's own page is how to go back to none.
  async function setDefaultView(id: string): Promise<void> {
    const view = vs.viewById(id);

    if (!view) {
      return;
    }

    const draft = vs.userDraft();

    if (view.id === BUILT_IN_STOCK_ID) {
      delete draft.defaultViewId;
      await vs.persist(draft, activeViewId.value);

      return;
    }

    const ownId = vs.ownCopy(draft, view);

    draft.defaultViewId = ownId;
    await vs.persist(draft, activeViewId.value === id ? ownId : activeViewId.value);
  }

  // The order the tabs were dragged into, by the key each view keeps its place by.
  async function reorderViews(ids: string[]): Promise<void> {
    const draft = vs.userDraft();

    draft.order = ids.map(vs.viewById).filter((view): view is View => !!view).map((view) => orderKeyOf(view, orgIds.value));
    await vs.persist(draft, activeViewId.value);
  }

  /**
   * After publishing, YOUR copy becomes a fork of the view you just published.
   *
   * Without this the bar would show the same view twice — once as yours, once as the organization's —
   * which is not two views, it is one view and its shadow.
   */
  async function linkToPublished(source: View, publishedId: string): Promise<void> {
    if (source.org || source.from === publishedId) {
      return;
    }

    if (editing.value) {
      const view = vs.workingView();

      if (view) {
        view.from = publishedId;
      }

      return;
    }

    const draft = scopes.value.user ? clone(scopes.value.user) : null;
    const mine = draft?.views.find((p) => p.id === source.id);

    if (draft && mine) {
      mine.from = publishedId;
      await saveView(store, 'user', draft, userId.value, props.page);
    }
  }

  // Publish the view to everyone. It joins the organization's scope, which is the only thing on this
  // page that is not personal — so it asks first.
  async function publishView(id: string): Promise<void> {
    const source = editing.value && id === activeViewId.value ? vs.workingView() : vs.viewById(id);

    if (!source || isStockView(source) || !await confirm({
      title:  t('configurableViews.page.publish.title'),
      body:   t('configurableViews.page.publish.body', { name: source.name, page: props.title }, true),
      action: t('configurableViews.page.publish.action'),
    })) {
      return;
    }

    const org: ViewSet = scopes.value.global ? clone(scopes.value.global) : { views: [] };
    const published: View = { ...clone(source), id: source.from || source.id };

    delete published.org;
    delete published.from;

    const at = org.views.findIndex((p) => p.id === published.id || p.name === published.name);

    if (at >= 0) {
      org.views.splice(at, 1, published);
    } else {
      org.views.push(published);
    }

    saving.value = true;
    error.value = '';

    try {
      await saveView(store, 'global', org, userId.value, props.page);
      await linkToPublished(source, published.id);
      await fetchTemplatingConfigMaps(store);
    } catch (e) {
      error.value = (e as Error)?.message || String(e);
    } finally {
      saving.value = false;
    }
  }

  // Take a view back out of the organization scope. It is everyone's, so it asks first. Any personal
  // fork of it stays, and simply stops being a fork: its `from` now points at nothing, which reads as
  // a plain personal view.
  //
  // Whether this is ALLOWED is not decided here: publishing writes the same ConfigMap with no check of
  // its own, so a check here would only be a suggestion. The write goes to the API and its RBAC
  // answers — a user who may not remove it gets that back as the error below.
  async function unpublishView(id: string): Promise<void> {
    const view = vs.viewById(id);
    const orgId = view?.org ? view.id : view?.from;

    if (!view || isStockView(view) || !orgId || !orgIds.value.has(orgId) || !await confirm({
      title:  t('configurableViews.page.unpublish.title'),
      body:   t('configurableViews.page.unpublish.body', { name: view.name }, true),
      action: t('configurableViews.page.unpublish.action'),
      danger: true,
    })) {
      return;
    }

    saving.value = true;
    error.value = '';

    try {
      const org: ViewSet = scopes.value.global ? clone(scopes.value.global) : { views: [] };

      org.views = org.views.filter((p) => p.id !== orgId);
      await saveView(store, 'global', org.views.length ? org : null, userId.value, props.page);
      await fetchTemplatingConfigMaps(store);

      if (view.org) {
        activeViewId.value = null;
        pinnedView.value = false;
      }
      vs.syncActiveView();
    } catch (e) {
      error.value = (e as Error)?.message || String(e);
    } finally {
      saving.value = false;
    }
  }

  // ---- delete, and undo ----

  /** A deleted view, offered back for a while. See deleteView. */
  const undo = ref<{ title: string, message: string, run:() => Promise<void> } | null>(null);
  let undoTimer: ReturnType<typeof setTimeout> | undefined;

  function closeUndo(): void {
    clearTimeout(undoTimer);
    undo.value = null;
  }

  function offerUndo(title: string, message: string, run: () => Promise<void>): void {
    closeUndo();
    undo.value = {
      title, message, run
    };
    undoTimer = setTimeout(closeUndo, UNDO_TIMEOUT);
  }

  onBeforeUnmount(() => clearTimeout(undoTimer));

  async function runUndo(): Promise<void> {
    const pending = undo.value;

    closeUndo();
    await pending?.run();
  }

  /**
   * Deleted at once and offered back, rather than confirmed first. Undo restores its place and whether
   * it was your default. A published view is not deleted but unpublished (see unpublishView).
   */
  async function deleteView(id: string): Promise<void> {
    const target = vs.viewById(id);

    if (!target || isStockView(target)) {
      return;
    }

    if (target.org) {
      await unpublishView(id);

      return;
    }

    // Deleting the view being edited: its edits go with it, and one never saved is simply dropped
    if (editing.value) {
      await leaveEdit();
    }

    const before = vs.userDraft();
    const at = before.views.findIndex((p) => p.id === id);

    if (at < 0) {
      return;
    }

    const removed = before.views[at];
    const wasDefault = before.defaultViewId === id;
    const wasActive = activeViewId.value === id;
    // Taken before the view goes: the tab to its left, or to its right when it was the first
    const list = views.value;
    const index = list.findIndex((p) => p.id === id);
    const neighbour = list[index > 0 ? index - 1 : index + 1];
    const draft = clone(before);

    draft.views.splice(at, 1);
    if (wasDefault) {
      delete draft.defaultViewId;
    }

    await vs.persist(draft, wasActive ? neighbour?.id || null : activeViewId.value);

    if (neighbour) {
      bar.value?.focusTab(neighbour.id);
    }

    offerUndo(t('configurableViews.bar.deleted'), t('configurableViews.bar.deletedMessage', { name: removed.name }, true), async() => {
      const now = vs.userDraft();

      now.views.splice(Math.min(at, now.views.length), 0, removed);

      if (wasDefault) {
        now.defaultViewId = removed.id;
      }

      await vs.persist(now, wasActive ? removed.id : activeViewId.value);
    });
  }

  return {
    renameStoredView,
    duplicateView,
    setDefaultView,
    reorderViews,
    publishView,
    unpublishView,
    deleteView,
    undo,
    closeUndo,
    runUndo,
  };
}
