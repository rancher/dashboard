import { EditorView, ViewPlugin } from '@codemirror/view';

/**
 * CodeMirror only handles presses on its content, which is as tall as the document. When a consumer gives
 * `.cm-editor` a min-height, the scroller fills the space below a short document and presses there did nothing.
 * This hands those presses to CodeMirror's own mouse handling, so a click places the cursor at the end of the
 * document and dragging, shift-click and double-click select just as they do on the text.
 *
 * The content can't simply be stretched to fill the editor: CodeMirror works out which lines are visible from the
 * content's bounding box, so a content box shorter than the document stops rendering lines once scrolled past it.
 */
export function handleClickBelowContent(view: EditorView, event: MouseEvent): boolean {
  if (event.button !== 0 || event.target !== view.scrollDOM || event.clientY <= view.contentDOM.getBoundingClientRect().bottom) {
    return false;
  }

  event.preventDefault();
  view.contentDOM.dispatchEvent(new MouseEvent('mousedown', event));

  return true;
}

export const clickBelowContent = ViewPlugin.define((view) => {
  const onMouseDown = (event: MouseEvent) => handleClickBelowContent(view, event);

  view.scrollDOM.addEventListener('mousedown', onMouseDown);

  return { destroy: () => view.scrollDOM.removeEventListener('mousedown', onMouseDown) };
});
