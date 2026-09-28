import { Position } from '@shell/types/window-manager';

/**
 * Id of the element holding the body of a window manager tab.
 *
 * The tab's `aria-controls` has to resolve to the element `TabBodyContainer`
 * renders, so both sides build the id from here. Tab ids can contain characters
 * that aren't valid in an id, hence the replace.
 */
export function tabBodyId(position: Position, id: string): string {
  return `wm-panel-body-${ position }-${ id.replace(/[^a-zA-Z0-9_-]/g, '-') }`;
}
