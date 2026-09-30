/**
 * The saved view shortcuts, bound with `v-shortkey` in ResourceTable's shortkeys template. The shortcut
 * plugin tells only the last table bound, and a page can hold two, so the table asking hands the action
 * to the list the focus is in
 */
export type TableViewShortcutAction = 'saveChanges' | 'openSaveAsNew' | 'duplicateCurrent';

export interface TableViewShortcutOwner {
  /** Whether the element, eg the focused one, is in this list */
  owns: (el: Element | null) => boolean;
  run: (action: TableViewShortcutAction) => void;
}

const owners = new Set<TableViewShortcutOwner>();

/** Returns the unregister */
export function registerTableViewShortcuts(owner: TableViewShortcutOwner): () => void {
  owners.add(owner);

  return () => {
    owners.delete(owner);
  };
}

export function runTableViewShortcut(action: TableViewShortcutAction, focused: Element | null = document.activeElement): void {
  const owner = Array.from(owners).find((o) => o.owns(focused));

  owner?.run(action);
}
