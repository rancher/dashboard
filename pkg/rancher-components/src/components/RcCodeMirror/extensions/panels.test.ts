import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { bottomPanelsExtension, coveredBottom } from './panels';

type Rect = { top: number; bottom: number; left?: number; width?: number };

function setRect(el: Element, {
  top, bottom, left = 0, width = 800
}: Rect): void {
  jest.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    top, bottom, left, width, right: left + width, height: bottom - top, x: left, y: top, toJSON: () => ({})
  } as DOMRect);
}

describe('extensions: panels', () => {
  let page: HTMLElement;
  let view: EditorView;

  // The editor's visible area runs from the top of the window to its bottom, 768px in jsdom
  beforeEach(() => {
    page = document.createElement('div');
    document.body.appendChild(page);
    view = new EditorView({ parent: page, state: EditorState.create({ doc: 'foo: bar' }) });
    setRect(view.scrollDOM, { top: 0, bottom: 2000 });
  });

  afterEach(() => {
    view.destroy();
    page.remove();
    delete (document as Partial<Document>).elementFromPoint;
    jest.restoreAllMocks();
  });

  function stuck(position: string, top: number, parent: HTMLElement = page): HTMLElement {
    const el = document.createElement('div');

    el.style.position = position;
    parent.appendChild(el);
    setRect(el, { top, bottom: 768 });

    return el;
  }

  function drawnAtBottom(el: Element): jest.Mock {
    const elementFromPoint = jest.fn(() => el);

    document.elementFromPoint = elementFromPoint;

    return elementFromPoint;
  }

  describe('coveredBottom', () => {
    it('should reserve the height of a footer stuck over the bottom of the editor', () => {
      drawnAtBottom(stuck('sticky', 712));

      expect(coveredBottom(view)).toStrictEqual(56);
    });

    it('should look at the middle of the visible bottom edge', () => {
      const elementFromPoint = drawnAtBottom(stuck('sticky', 712));

      coveredBottom(view);

      expect(elementFromPoint).toHaveBeenCalledWith(400, 767);
    });

    it('should look at the bottom of the element the editor scrolls in', () => {
      const elementFromPoint = drawnAtBottom(stuck('sticky', 364));

      page.style.overflowY = 'auto';
      setRect(page, { top: 0, bottom: 422 });
      // A 1px border, and a horizontal scrollbar below the 420px it shows
      jest.spyOn(page, 'clientTop', 'get').mockReturnValue(1);
      jest.spyOn(page, 'clientHeight', 'get').mockReturnValue(419);

      expect({ covered: coveredBottom(view), y: elementFromPoint.mock.calls[0][1] }).toStrictEqual({ covered: 56, y: 419 });
    });

    it('should reserve the height of a fixed element through the element drawn on top of it', () => {
      const footer = stuck('fixed', 700);
      const button = document.createElement('button');

      footer.appendChild(button);
      drawnAtBottom(button);

      expect(coveredBottom(view)).toStrictEqual(68);
    });

    it.each(['static', 'relative', 'absolute'])('should not reserve space for a %s element, which scrolls with the editor', (position) => {
      drawnAtBottom(stuck(position, 712));

      expect(coveredBottom(view)).toStrictEqual(0);
    });

    it('should not reserve space when the editor itself is drawn there', () => {
      drawnAtBottom(view.contentDOM);

      expect(coveredBottom(view)).toStrictEqual(0);
    });

    // A modal's footer sits below its scrolling body, in a fixed panel that holds the editor too
    it('should not reserve space for a fixed element holding the editor', () => {
      const modal = document.createElement('div');
      const footer = document.createElement('div');

      modal.style.position = 'fixed';
      document.body.appendChild(modal);
      modal.appendChild(page);
      modal.appendChild(footer);
      drawnAtBottom(footer);

      expect(coveredBottom(view)).toStrictEqual(0);
    });

    it('should reserve at most half of the visible editor', () => {
      drawnAtBottom(stuck('sticky', 100));

      expect(coveredBottom(view)).toStrictEqual(384);
    });

    it('should not reserve space when the browser cannot say what is drawn', () => {
      stuck('sticky', 712);

      expect(coveredBottom(view)).toStrictEqual(0);
    });
  });

  describe('bottomPanelsExtension', () => {
    function margins(strip: HTMLElement) {
      const state = EditorState.create({ extensions: [bottomPanelsExtension(strip)] });
      const [margin] = state.facet(EditorView.scrollMargins);

      return margin(view);
    }

    it('should keep the cursor below the strip while it shows a panel', () => {
      const strip = document.createElement('div');

      strip.appendChild(document.createElement('div'));
      setRect(strip, { top: 0, bottom: 40 });

      expect(margins(strip)).toStrictEqual({ top: 40, bottom: 0 });
    });

    it('should not reserve space for an empty strip', () => {
      expect(margins(document.createElement('div'))).toStrictEqual({ top: 0, bottom: 0 });
    });
  });
});
