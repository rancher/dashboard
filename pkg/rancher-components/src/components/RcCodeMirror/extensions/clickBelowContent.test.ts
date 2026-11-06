import { EditorSelection, EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { clickBelowContent, handleClickBelowContent } from './clickBelowContent';

const DOC = 'foo: bar\nbaz: qux';

describe('extensions: clickBelowContent', () => {
  let page: HTMLElement;
  let view: EditorView;

  // The document ends 100px down the window
  beforeEach(() => {
    page = document.createElement('div');
    document.body.appendChild(page);
    view = new EditorView({
      parent: page,
      state:  EditorState.create({
        doc: DOC, selection: EditorSelection.cursor(3), extensions: [clickBelowContent]
      })
    });
    jest.spyOn(view.contentDOM, 'getBoundingClientRect').mockReturnValue({ bottom: 100 } as DOMRect);
  });

  afterEach(() => {
    view.destroy();
    page.remove();
    jest.restoreAllMocks();
  });

  function mousedown(target: Element, init: ConstructorParameters<typeof MouseEvent>[1] = {}): MouseEvent {
    const event = new MouseEvent('mousedown', {
      bubbles: true, cancelable: true, button: 0, clientY: 300, ...init
    });

    target.dispatchEvent(event);

    return event;
  }

  function selection(): { anchor: number; head: number } {
    const { anchor, head } = view.state.selection.main;

    return { anchor, head };
  }

  describe('a click on the scroller below the document', () => {
    it('should place the cursor at the end of the document', () => {
      mousedown(view.scrollDOM);

      expect(selection()).toStrictEqual({ anchor: DOC.length, head: DOC.length });
    });

    it('should extend the selection to the end of the document on shift-click', () => {
      mousedown(view.scrollDOM, { shiftKey: true });

      expect(selection()).toStrictEqual({ anchor: 3, head: DOC.length });
    });

    it('should focus the editor', () => {
      const focus = jest.spyOn(view, 'focus');

      mousedown(view.scrollDOM);

      expect(focus).toHaveBeenCalledWith();
    });

    it('should prevent the browser from handling the click', () => {
      expect(mousedown(view.scrollDOM).defaultPrevented).toStrictEqual(true);
    });

    it('should mark the selection as a pointer selection', () => {
      const dispatch = jest.spyOn(view, 'dispatch');

      mousedown(view.scrollDOM);

      expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ userEvent: 'select.pointer', scrollIntoView: true }));
    });
  });

  describe('clicks it leaves to CodeMirror', () => {
    it.each([
      ['level with the document', { clientY: 100 }],
      ['above the bottom of the document', { clientY: 50 }],
      ['with a button other than the primary one', { button: 2 }]
    ])('should ignore a click on the scroller %s', (_, init) => {
      const event = mousedown(view.scrollDOM, init);

      expect({ selection: selection(), prevented: event.defaultPrevented }).toStrictEqual({ selection: { anchor: 3, head: 3 }, prevented: false });
    });
  });

  describe('handleClickBelowContent', () => {
    function clickOn(target: Element, clientY: number): MouseEvent {
      const event = new MouseEvent('mousedown', { button: 0, clientY });

      Object.defineProperty(event, 'target', { value: target });

      return event;
    }

    it('should report that it handled a click on the scroller below the document', () => {
      expect(handleClickBelowContent(view, clickOn(view.scrollDOM, 300))).toStrictEqual(true);
    });

    it('should report that it ignored a click on the scroller beside the document', () => {
      expect(handleClickBelowContent(view, clickOn(view.scrollDOM, 50))).toStrictEqual(false);
    });

    it.each([
      ['content', () => view.contentDOM],
      ['gutters', () => view.scrollDOM.appendChild(document.createElement('div'))]
    ])('should ignore a click below the document on the %s', (_, target) => {
      expect(handleClickBelowContent(view, clickOn(target(), 300))).toStrictEqual(false);
    });
  });

  it('should stop listening once the editor is destroyed', () => {
    const remove = jest.spyOn(view.scrollDOM, 'removeEventListener');

    view.destroy();

    expect(remove).toHaveBeenCalledWith('mousedown', expect.any(Function));
  });
});
