import { EditorSelection } from '@codemirror/state';
import { EditorView, ViewPlugin } from '@codemirror/view';

/**
 * CodeMirror only handles clicks on its content, which is as tall as the document. When a consumer gives
 * `.cm-editor` a min-height, the scroller fills the space below a short document and clicks there did nothing.
 * This places the cursor at the end of the document instead, extending the selection on shift-click.
 *
 * The content can't simply be stretched to fill the editor: CodeMirror works out which lines are visible from the
 * content's bounding box, so a content box shorter than the document stops rendering lines once scrolled past it.
 */
export function handleClickBelowContent(view: EditorView, event: MouseEvent): boolean {
  if (event.button !== 0 || event.target !== view.scrollDOM || event.clientY <= view.contentDOM.getBoundingClientRect().bottom) {
    return false;
  }

  const end = view.state.doc.length;
  const anchor = event.shiftKey ? view.state.selection.main.anchor : end;

  event.preventDefault();
  view.dispatch({
    selection:      EditorSelection.single(anchor, end),
    scrollIntoView: true,
    userEvent:      'select.pointer'
  });
  view.focus();

  return true;
}

export const clickBelowContent = ViewPlugin.define((view) => {
  const onMouseDown = (event: MouseEvent) => handleClickBelowContent(view, event);

  view.scrollDOM.addEventListener('mousedown', onMouseDown);

  return { destroy: () => view.scrollDOM.removeEventListener('mousedown', onMouseDown) };
});
