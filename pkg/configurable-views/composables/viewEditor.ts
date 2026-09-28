import { inject, type InjectionKey } from 'vue';
import type { CatalogEntry } from '../templating/widget-catalog';

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
  select(id: string | null): void;
  move(id: string, delta: number): void;
  remove(id: string): void;
  configure(id: string, anchor: SettingsAnchor | null): void;
  beginDrag(id: string): void;
  endDrag(): void;
  dropAt(index: number): void;
  setColSpan(id: string, span: number): void;
  ui: ViewEditorUi;
}

/** The key the Home provides the editor under. */
export const VIEW_EDITOR: InjectionKey<ViewEditor> = Symbol('viewEditor');

/**
 * The editor, or - for a grid rendered outside an editing Home - one that does nothing, so the grid
 * and its widgets draw the same either way.
 */
export function useViewEditor(): ViewEditor {
  return inject(VIEW_EDITOR, () => ({
    select:     () => undefined,
    move:       () => undefined,
    remove:     () => undefined,
    configure:  () => undefined,
    beginDrag:  () => undefined,
    endDrag:    () => undefined,
    dropAt:     () => undefined,
    setColSpan: () => undefined,
    ui:         {
      dragId: null, dragEntry: null, dragLabel: '', showBoxModel: false
    },
  }), true);
}
