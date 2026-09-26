import { EditorState, type Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import {
  codeFolding, foldable, foldedRanges, foldService, ensureSyntaxTree, syntaxTreeAvailable
} from '@codemirror/language';
import { yaml } from '@codemirror/lang-yaml';
import {
  indentFoldService,
  bracketFoldService,
  commentFoldService,
  buildFoldExtension,
  foldByLineMatch,
  foldByYamlPath,
  foldAllComments,
  foldMatchingLines,
  foldYamlPath,
} from './fold';

function createState(doc: string, extensions: Extension[]): EditorState {
  const state = EditorState.create({ doc, extensions });

  ensureSyntaxTree(state, state.doc.length, 5000);

  return state;
}

function foldableAt(state: EditorState, lineNumber: number) {
  const line = state.doc.line(lineNumber);

  return foldable(state, line.from, line.to);
}

function createView(doc: string, extensions: Extension[]): EditorView {
  const view = new EditorView({ state: createState(doc, [codeFolding(), ...extensions]) });

  ensureSyntaxTree(view.state, view.state.doc.length, 5000);

  return view;
}

function folded(view: EditorView): { from: number; to: number }[] {
  const ranges: { from: number; to: number }[] = [];

  foldedRanges(view.state).between(0, view.state.doc.length, (from, to) => {
    ranges.push({ from, to });
  });

  return ranges;
}

const yamlDoc = [
  'metadata:', //  1
  '  name: a', //  2
  '  labels:', //  3
  '    app: a', //  4
  'spec:', //  5
  '  labels:', //  6
  '    app: b', //  7
].join('\n');

const yamlListDoc = [
  'spec:',
  '  containers:',
  '    - name: web',
  '      ports:',
  '        - containerPort: 80',
  '      resources:',
  '        limits:',
  '          cpu: 500m',
  '    - name: api',
  '      resources:',
  '        limits:',
  '          memory: 2Gi',
].join('\n');

describe('fold extensions', () => {
  describe('indentFoldService', () => {
    it('should fold the indented block below a line', () => {
      const state = createState('a:\n  b: 1\n  c: 2\nd: 3', [indentFoldService]);

      expect(foldableAt(state, 1)).toStrictEqual({ from: 2, to: 16 });
    });

    it('should include trailing blank lines inside the block', () => {
      const state = createState('a:\n  b: 1\n\nd: 3', [indentFoldService]);

      expect(foldableAt(state, 1)).toStrictEqual({ from: 2, to: 10 });
    });

    it('should not fold a line without an indented block below it', () => {
      const state = createState('a: 1\nb: 2', [indentFoldService]);

      expect(foldableAt(state, 1)).toBeNull();
    });

    it('should not fold a blank line', () => {
      const state = createState('\n  a: 1', [indentFoldService]);

      expect(foldableAt(state, 1)).toBeNull();
    });
  });

  describe('bracketFoldService', () => {
    it.each([
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ])('should fold between %s and %s across lines', (open, close) => {
      const state = createState(`${ open }\n  1\n${ close }`, [bracketFoldService]);

      expect(foldableAt(state, 1)).toStrictEqual({ from: 1, to: 5 });
    });

    it('should match nested brackets of the same type', () => {
      const state = createState('{\n  {\n  }\n}', [bracketFoldService]);

      expect(foldableAt(state, 1)).toStrictEqual({ from: 1, to: 9 });
    });

    it('should recompute bracket pairs after the document changes', () => {
      const state = createState('{\n  1\n}', [bracketFoldService]);

      foldableAt(state, 1);
      const closingLine = state.doc.line(3);
      const updated = state.update({
        changes: {
          from: closingLine.from, to: closingLine.to, insert: 'no closing bracket'
        }
      }).state;

      expect(foldableAt(updated, 1)).toBeNull();
    });

    it('should not fold brackets that close on the same line', () => {
      const state = createState('{ a: 1 }\nb', [bracketFoldService]);

      expect(foldableAt(state, 1)).toBeNull();
    });

    it('should not fold an unclosed bracket', () => {
      const state = createState('{\n  a', [bracketFoldService]);

      expect(foldableAt(state, 1)).toBeNull();
    });

    it('should not fold a line without brackets', () => {
      const state = createState('a\nb', [bracketFoldService]);

      expect(foldableAt(state, 1)).toBeNull();
    });
  });

  describe('commentFoldService', () => {
    it('should fold comment lines with deeper-indented comment children', () => {
      const state = createState('# a\n#   b\n#   c\nd', [commentFoldService]);

      expect(foldableAt(state, 1)).toStrictEqual({ from: 3, to: 15 });
    });

    it('should stop at the first non-comment line', () => {
      const state = createState('# a\n#   b\nc\n#   d', [commentFoldService]);

      expect(foldableAt(state, 1)).toStrictEqual({ from: 3, to: 9 });
    });

    it('should not fold a comment without deeper children', () => {
      const state = createState('# a\n# b', [commentFoldService]);

      expect(foldableAt(state, 1)).toBeNull();
    });

    it('should not fold a non-comment line', () => {
      const state = createState('a\n#   b', [commentFoldService]);

      expect(foldableAt(state, 1)).toBeNull();
    });
  });

  describe('buildFoldExtension', () => {
    it.each([
      ['indent', 'a:\n  b', { from: 2, to: 6 }],
      ['bracket', '{\n}', { from: 1, to: 1 }],
    ] as const)('should register the %s fold service', (strategy, doc, expected) => {
      const state = createState(doc, [buildFoldExtension({ strategy })]);

      expect(foldableAt(state, 1)).toStrictEqual(expected);
    });

    it('should register no fold service for the language strategy', () => {
      const state = createState('a:\n  b', [buildFoldExtension()]);

      expect(foldableAt(state, 1)).toBeNull();
    });

    it('should register a custom fold extension', () => {
      const state = createState('a:\n  b', [buildFoldExtension({ custom: indentFoldService })]);

      expect(foldableAt(state, 1)).toStrictEqual({ from: 2, to: 6 });
    });

    it('should enable folding', () => {
      const view = new EditorView({ state: createState('a:\n  b', [buildFoldExtension({ strategy: 'indent' })]) });

      foldMatchingLines(view, /^a:/);

      expect(folded(view)).toStrictEqual([{ from: 2, to: 6 }]);
    });

    it('should not include the fold gutter', () => {
      const view = new EditorView({ state: createState('a', [buildFoldExtension()]) });

      expect(view.dom.querySelector('.cm-foldGutter')).toBeNull();
    });
  });

  describe('foldByLineMatch', () => {
    it('should fold a matching line', () => {
      const state = createState(yamlDoc, [foldByLineMatch(/^spec:/)]);

      expect(foldableAt(state, 5)).toStrictEqual({ from: 46, to: 67 });
    });

    it('should not fold a line that does not match', () => {
      const state = createState(yamlDoc, [foldByLineMatch(/^spec:/)]);

      expect(foldableAt(state, 1)).toBeNull();
    });

    it('should fold a matching line every time it is checked with a global pattern', () => {
      const state = createState(yamlDoc, [foldByLineMatch(/^spec:/g)]);

      foldableAt(state, 5);

      expect(foldableAt(state, 5)).toStrictEqual({ from: 46, to: 67 });
    });

    it('should fold a line matching a sticky pattern after the start of the line', () => {
      const state = createState(yamlDoc, [foldByLineMatch(/labels:/y)]);

      expect(foldableAt(state, 3)).toStrictEqual({ from: 29, to: 40 });
    });
  });

  describe('foldByYamlPath', () => {
    // The YAML language folds every mapping on its own, so call the service
    // directly to see only what foldByYamlPath contributes.
    function yamlPathRangeAt(path: string, lineNumber: number, doc = yamlDoc) {
      const state = createState(doc, [yaml(), foldByYamlPath(path)]);
      const [service] = state.facet(foldService);
      const line = state.doc.line(lineNumber);

      return service(state, line.from, line.to);
    }

    it('should fold the key at the given path', () => {
      expect(yamlPathRangeAt('metadata.labels', 3)).toStrictEqual({ from: 29, to: 40 });
    });

    it('should not fold a key with the same name at a different path', () => {
      expect(yamlPathRangeAt('metadata.labels', 6)).toBeNull();
    });

    it('should not claim a key inside a list as a root key', () => {
      expect(yamlPathRangeAt('ports', 4, yamlListDoc)).toBeNull();
    });

    it.each([
      ['spec.containers[0].ports', 4],
      ['spec.containers[1].resources', 10],
    ])('should match the indexed path %s', (path, lineNumber) => {
      expect(yamlPathRangeAt(path, lineNumber, yamlListDoc)).not.toBeNull();
    });

    it('should not match a different list item', () => {
      expect(yamlPathRangeAt('spec.containers[0].resources', 10, yamlListDoc)).toBeNull();
    });
  });

  describe('foldAllComments', () => {
    it('should fold every comment block with children', () => {
      const view = createView('# a\n#   b\nc\n# d\n#   e', []);

      foldAllComments(view);

      expect(folded(view)).toStrictEqual([{ from: 3, to: 9 }, { from: 15, to: 21 }]);
    });

    it('should not dispatch when there is nothing to fold', () => {
      const view = createView('a\nb', []);
      const dispatch = jest.spyOn(view, 'dispatch');

      foldAllComments(view);

      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe('foldMatchingLines', () => {
    it('should fold every matching line that has a fold range', () => {
      const view = createView(yamlDoc, [indentFoldService]);

      foldMatchingLines(view, /labels:/);

      expect(folded(view)).toStrictEqual([{ from: 29, to: 40 }, { from: 56, to: 67 }]);
    });

    it.each([
      ['global', /labels:/g],
      ['sticky', /labels:/y],
    ])('should fold every matching line with a %s pattern', (_, pattern) => {
      const view = createView(yamlDoc, [indentFoldService]);

      foldMatchingLines(view, pattern);

      expect(folded(view)).toStrictEqual([{ from: 29, to: 40 }, { from: 56, to: 67 }]);
    });

    it('should not dispatch when no line matches', () => {
      const view = createView(yamlDoc, [indentFoldService]);
      const dispatch = jest.spyOn(view, 'dispatch');

      foldMatchingLines(view, /^missing:/);

      expect(dispatch).not.toHaveBeenCalled();
    });

    it('should fold a language fold range beyond the initially parsed content', () => {
      const filler = Array.from({ length: 500 }, (_, i) => `key${ i }: value`).join('\n');
      const doc = `${ filler }\nstatus:\n  phase: Running\n`;
      const view = new EditorView({ state: EditorState.create({ doc, extensions: [codeFolding(), yaml()] }) });
      const status = view.state.doc.line(501);

      expect(syntaxTreeAvailable(view.state, status.to)).toBe(false);

      foldMatchingLines(view, /^status:\s*$/);

      expect(folded(view)).toStrictEqual([{ from: status.to, to: view.state.doc.line(502).to }]);
    });
  });

  describe('foldYamlPath', () => {
    it('should fold only the key at the given path', () => {
      const view = createView(yamlDoc, [yaml(), indentFoldService]);

      foldYamlPath(view, 'spec.labels');

      expect(folded(view)).toStrictEqual([{ from: 56, to: 67 }]);
    });

    it('should not dispatch when the path does not exist', () => {
      const view = createView(yamlDoc, [yaml(), indentFoldService]);
      const dispatch = jest.spyOn(view, 'dispatch');

      foldYamlPath(view, 'spec.missing');

      expect(dispatch).not.toHaveBeenCalled();
    });

    it('should not fold a key inside a list for a root path', () => {
      const view = createView(yamlListDoc, [yaml(), indentFoldService]);
      const dispatch = jest.spyOn(view, 'dispatch');

      foldYamlPath(view, 'resources');

      expect(dispatch).not.toHaveBeenCalled();
    });

    it('should fold a key at an indexed list path', () => {
      const view = createView(yamlListDoc, [yaml(), indentFoldService]);

      foldYamlPath(view, 'spec.containers[1].resources');

      expect(folded(view)).toStrictEqual([{ from: view.state.doc.line(10).to, to: view.state.doc.line(12).to }]);
    });
  });
});
