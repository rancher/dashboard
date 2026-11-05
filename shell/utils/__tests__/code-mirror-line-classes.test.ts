import { EditorView, lineNumbers } from '@codemirror/view';
import { setLineClasses } from '@shell/utils/code-mirror-line-classes';

describe('fx: code-mirror-line-classes', () => {
  const DOC = 'a: 1\nb: 2\nc: 3';
  const CLASS = 'my-class';

  const createView = (doc = DOC) => new EditorView({ doc, extensions: [lineNumbers()] });
  const lineClasses = (view: EditorView) => Array.from(view.contentDOM.querySelectorAll('.cm-line')).map((l) => l.className);
  const gutterClasses = (view: EditorView) => Array.from(view.dom.querySelectorAll('.cm-lineNumbers .cm-gutterElement'))
    .filter((el) => /^\d+$/.test(el.textContent || '') && !(el as HTMLElement).style.visibility)
    .map((el) => el.className);

  describe('setLineClasses', () => {
    it('puts the class on the given lines', () => {
      const view = createView();

      setLineClasses(view, [{ line: 0, className: CLASS }, { line: 2, className: CLASS }]);

      expect(lineClasses(view)).toStrictEqual([`cm-line ${ CLASS }`, 'cm-line', `cm-line ${ CLASS }`]);
    });

    it('puts the class on the gutters of the given lines', () => {
      const view = createView();

      setLineClasses(view, [{ line: 1, className: CLASS }]);

      expect(gutterClasses(view)).toStrictEqual(['cm-gutterElement', `cm-gutterElement ${ CLASS }`, 'cm-gutterElement']);
    });

    it('puts each line\'s own class on it', () => {
      const view = createView();

      setLineClasses(view, [{ line: 0, className: 'first' }, { line: 1, className: 'second' }]);

      expect(lineClasses(view)).toStrictEqual(['cm-line first', 'cm-line second', 'cm-line']);
    });

    it('ignores line numbers outside the document', () => {
      const view = createView();

      setLineClasses(view, [{ line: -1, className: CLASS }, { line: 1, className: CLASS }, { line: 3, className: CLASS }, { line: 99, className: CLASS }]);

      expect(lineClasses(view)).toStrictEqual(['cm-line', `cm-line ${ CLASS }`, 'cm-line']);
    });

    it('accepts the lines in any order', () => {
      const view = createView();

      setLineClasses(view, [{ line: 2, className: CLASS }, { line: 0, className: CLASS }]);

      expect(lineClasses(view)).toStrictEqual([`cm-line ${ CLASS }`, 'cm-line', `cm-line ${ CLASS }`]);
    });

    it('replaces the previous classes', () => {
      const view = createView();

      setLineClasses(view, [{ line: 0, className: CLASS }]);
      setLineClasses(view, [{ line: 2, className: CLASS }]);

      expect(lineClasses(view)).toStrictEqual(['cm-line', 'cm-line', `cm-line ${ CLASS }`]);
    });

    it('clears the classes when called without lines', () => {
      const view = createView();

      setLineClasses(view, [{ line: 0, className: CLASS }]);
      setLineClasses(view);

      expect(lineClasses(view)).toStrictEqual(['cm-line', 'cm-line', 'cm-line']);
    });

    it('keeps a class on its line when a line is added above it', () => {
      const view = createView();

      setLineClasses(view, [{ line: 1, className: CLASS }]);
      view.dispatch({ changes: { from: 0, insert: 'z: 0\n' } });

      expect(lineClasses(view)).toStrictEqual(['cm-line', 'cm-line', `cm-line ${ CLASS }`, 'cm-line']);
    });
  });
});
