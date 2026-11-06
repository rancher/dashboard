import { EditorState } from '@codemirror/state';
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
      state:  EditorState.create({ doc: DOC, extensions: [clickBelowContent] })
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

  // The presses forwarded to the content, caught before CodeMirror's own handler, which needs a real layout
  function forwarded(): MouseEvent[] {
    const events: MouseEvent[] = [];

    page.addEventListener('mousedown', (event) => {
      if (event.target === view.contentDOM) {
        events.push(event);
        event.stopPropagation();
      }
    }, true);

    return events;
  }

  describe('a press on the scroller below the document', () => {
    it('should hand the press to CodeMirror on the content', () => {
      const events = forwarded();

      mousedown(view.scrollDOM);

      expect(events).toHaveLength(1);
    });

    it.each([
      ['position', { clientX: 40, clientY: 300 }, (e: MouseEvent) => ({ clientX: e.clientX, clientY: e.clientY })],
      ['modifier keys', { shiftKey: true, altKey: true }, (e: MouseEvent) => ({ shiftKey: e.shiftKey, altKey: e.altKey })],
      ['click count, so double-click selects a word', { detail: 2 }, (e: MouseEvent) => ({ detail: e.detail })],
      ['button', { button: 0, buttons: 1 }, (e: MouseEvent) => ({ button: e.button, buttons: e.buttons })]
    ])('should keep the press\'s %s', (_, init, pick) => {
      const events = forwarded();

      mousedown(view.scrollDOM, init);

      expect(pick(events[0])).toStrictEqual(pick(new MouseEvent('mousedown', {
        button: 0, clientY: 300, ...init
      })));
    });

    it('should forward a press that bubbles and can be cancelled, as CodeMirror expects', () => {
      const events = forwarded();

      mousedown(view.scrollDOM);

      expect({ bubbles: events[0].bubbles, cancelable: events[0].cancelable }).toStrictEqual({ bubbles: true, cancelable: true });
    });

    it('should prevent the browser from handling the original press', () => {
      forwarded();

      expect(mousedown(view.scrollDOM).defaultPrevented).toStrictEqual(true);
    });
  });

  describe('presses it leaves alone', () => {
    it.each([
      ['level with the document', { clientY: 100 }],
      ['above the bottom of the document', { clientY: 50 }],
      ['with the middle button', { button: 1 }],
      ['with the secondary button', { button: 2 }]
    ])('should ignore a press on the scroller %s', (_, init) => {
      const events = forwarded();
      const event = mousedown(view.scrollDOM, init);

      expect({ forwarded: events.length, prevented: event.defaultPrevented }).toStrictEqual({ forwarded: 0, prevented: false });
    });
  });

  describe('handleClickBelowContent', () => {
    function clickOn(target: Element, clientY: number): MouseEvent {
      const event = new MouseEvent('mousedown', { button: 0, clientY });

      Object.defineProperty(event, 'target', { value: target });

      return event;
    }

    it('should report that it handled a press on the scroller below the document', () => {
      forwarded();

      expect(handleClickBelowContent(view, clickOn(view.scrollDOM, 300))).toStrictEqual(true);
    });

    it('should report that it ignored a press on the scroller beside the document', () => {
      expect(handleClickBelowContent(view, clickOn(view.scrollDOM, 50))).toStrictEqual(false);
    });

    it.each([
      ['content', () => view.contentDOM],
      ['gutters', () => view.scrollDOM.appendChild(document.createElement('div'))]
    ])('should ignore a press below the document on the %s', (_, target) => {
      expect(handleClickBelowContent(view, clickOn(target(), 300))).toStrictEqual(false);
    });
  });

  it('should stop listening once the editor is destroyed', () => {
    const remove = jest.spyOn(view.scrollDOM, 'removeEventListener');

    view.destroy();

    expect(remove).toHaveBeenCalledWith('mousedown', expect.any(Function));
  });
});
