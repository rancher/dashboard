import type { Extension } from '@codemirror/state';
import { EditorView, panels } from '@codemirror/view';

/**
 * How much of the editor's visible bottom edge a page covers with something stuck in place, such as the action
 * footer Edit YAML sticks to the bottom of its scroll area. CodeMirror does not know about it, so it would scroll
 * the cursor or a search match beneath it.
 *
 * Asks the browser what is drawn at that edge. Only an element that is sticky or fixed stays over the editor as it
 * scrolls, and one that contains the editor (a modal, for example) moves with it rather than covering it.
 */
const CLIPS = ['auto', 'scroll', 'hidden', 'clip'];

// The bottom of the part of the editor that can be seen, inside the window and every element it scrolls in
function visibleBottom(view: EditorView): number {
  const doc = view.dom.ownerDocument;
  let bottom = Math.min(doc.defaultView?.innerHeight ?? Infinity, view.scrollDOM.getBoundingClientRect().bottom);

  for (let el = view.dom.parentElement; el && el !== doc.body; el = el.parentElement) {
    // Inside its border and any horizontal scrollbar
    if (CLIPS.includes(getComputedStyle(el).overflowY)) {
      bottom = Math.min(bottom, el.getBoundingClientRect().top + el.clientTop + el.clientHeight);
    }
  }

  return bottom;
}

export function coveredBottom(view: EditorView): number {
  const doc = view.dom.ownerDocument;
  const scroller = view.scrollDOM.getBoundingClientRect();
  const bottom = visibleBottom(view);

  // jsdom has no elementFromPoint
  if (bottom <= scroller.top || typeof doc.elementFromPoint !== 'function') {
    return 0;
  }

  const hit = doc.elementFromPoint(scroller.left + (scroller.width / 2), bottom - 1);

  // The editor's own sticky parts, such as its gutters, do not hide its text
  if (!hit || view.dom.contains(hit)) {
    return 0;
  }

  for (let el: Element | null = hit; el && !el.contains(view.dom); el = el.parentElement) {
    const { position } = getComputedStyle(el);

    if (position === 'sticky' || position === 'fixed') {
      // Never reserve more than half of what is visible, so the cursor always has somewhere to go
      return Math.min(Math.max(0, bottom - el.getBoundingClientRect().top), (bottom - Math.max(0, scroller.top)) / 2);
    }
  }

  return 0;
}

/**
 * Pages such as Edit YAML stick their own footer to the bottom of the scroll area, where it covers CodeMirror's
 * bottom panels, such as Vim's command line. Place them in `strip`, which RcCodeMirror shows above the editor,
 * sticking to the top of the scroll area, as CodeMirror 5's Vim command line did.
 *
 * CodeMirror does not count panels outside the editor in its scroll margins, nor the page's footer, so count both,
 * keeping the cursor and matches out from under them.
 */
export function bottomPanelsExtension(strip: HTMLElement): Extension {
  return [
    panels({ bottomContainer: strip }),
    EditorView.scrollMargins.of((view) => ({
      top:    strip.firstChild ? Math.max(0, strip.getBoundingClientRect().bottom - Math.max(0, view.scrollDOM.getBoundingClientRect().top)) : 0,
      bottom: coveredBottom(view)
    }))
  ];
}
