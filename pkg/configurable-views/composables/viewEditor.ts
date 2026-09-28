import { inject, type InjectionKey } from 'vue';
import type { CatalogEntry } from '../templating/widget-catalog';
import type { WidgetPlace } from '../templating/types';

/**
 * What the grid and every widget on it share while a view is being edited. One reactive object,
 * owned by the Home, so a drag started on one widget lights up the drop targets everywhere else.
 */
export interface ViewEditorUi {
  /** The widget being dragged to a new place. */
  dragId: string | null;
  /** The catalog entry being dragged in from the drawer. */
  dragEntry: CatalogEntry | null;
  /** What the drop target calls the thing being dragged in ("Drop here to add a Table"). */
  dragLabel: string;
  /** The kind of whatever is being dragged, so a tab can refuse a Tabs widget before it is dropped. */
  dragKind: string;
  /** Which grid the pointer is over (see placeKey), so only that one draws its insertion marker. */
  dropPlace: string;
  /** The Layout tab's Advanced section is open, so the selected widget shows its margin and padding. */
  showBoxModel: boolean;
}

/** Where a widget's settings open: beside the widget, at its top-left corner. */
export interface SettingsAnchor {
  left: number;
  top: number;
}

/** What a widget on the grid can ask the Home to do. */
export interface ViewEditor {
  /** The view is being edited. A grid inside a Tabs widget reads this rather than being told. */
  readonly editing: boolean;
  /** The selected widget, wherever it is. */
  readonly selectedId: string | null;
  select(id: string | null): void;
  move(id: string, delta: number): void;
  remove(id: string): void;
  configure(id: string, anchor: SettingsAnchor | null): void;
  beginDrag(id: string): void;
  endDrag(): void;
  /** Drop what is being dragged at `index` of the list at `place` (null: the view's own). */
  dropAt(index: number, place?: WidgetPlace | null): void;
  setColSpan(id: string, span: number): void;
  ui: ViewEditorUi;
}

/** A grid's name in `ui.dropPlace`: '' for the view's own, the tab's address for one inside a Tabs widget. */
export function placeKey(place: WidgetPlace | null | undefined): string {
  return place ? `${ place.parentId }/${ place.tabId }` : '';
}

/** The key the Home provides the editor under. */
export const VIEW_EDITOR: InjectionKey<ViewEditor> = Symbol('viewEditor');

/**
 * The editor, or - for a grid rendered outside an editing Home - one that does nothing, so the grid
 * and its widgets draw the same either way.
 */
export function useViewEditor(): ViewEditor {
  return inject(VIEW_EDITOR, () => ({
    editing:    false,
    selectedId: null,
    select:     () => undefined,
    move:       () => undefined,
    remove:     () => undefined,
    configure:  () => undefined,
    beginDrag:  () => undefined,
    endDrag:    () => undefined,
    dropAt:     () => undefined,
    setColSpan: () => undefined,
    ui:         {
      dragId: null, dragEntry: null, dragLabel: '', dragKind: '', dropPlace: '', showBoxModel: false
    },
  }), true);
}
