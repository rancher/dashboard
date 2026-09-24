import type { Extension } from '@codemirror/state';
import { EditorView, Decoration, ViewPlugin } from '@codemirror/view';
import type { ViewUpdate, DecorationSet } from '@codemirror/view';
import { language, syntaxHighlighting, syntaxTree } from '@codemirror/language';
import { tagHighlighter, tags } from '@lezer/highlight';

const rancherHighlight = tagHighlighter([
  { tag: [tags.propertyName, tags.definition(tags.propertyName)], class: 'cm-rancher-key' },
  { tag: [tags.string, tags.attributeValue], class: 'cm-rancher-string' },
  { tag: [tags.keyword, tags.atom, tags.bool, tags.null], class: 'cm-rancher-keyword' },
  { tag: tags.comment, class: 'cm-rancher-comment' }
]);

const booleanMark = Decoration.mark({ class: 'cm-rancher-keyword' });
const booleanValue = /^(?:true|false|on|off|yes|no)$/i;

function yamlBooleans(view: EditorView): DecorationSet {
  const marks: { from: number; to: number }[] = [];

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (node) => {
        if (node.name === 'Literal' && node.node.parent?.name !== 'Key' && booleanValue.test(view.state.sliceDoc(node.from, node.to))) {
          marks.push({ from: node.from, to: node.to });
        }
      }
    });
  }

  return Decoration.set(marks.map(({ from, to }) => booleanMark.range(from, to)), true);
}

const yamlBooleanHighlight = ViewPlugin.fromClass(class {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = yamlBooleans(view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged || update.startState.facet(language) !== update.state.facet(language)) {
      this.decorations = yamlBooleans(update.view);
    }
  }
}, { decorations: (plugin) => plugin.decorations });

const rancherEditorTheme = EditorView.theme({
  '&': {
    color:           'var(--rc-cm-text)',
    backgroundColor: 'var(--rc-cm-bg)'
  },
  '.cm-content':                                                                                                                { caretColor: 'var(--rc-cm-key)' },
  '.cm-cursor, .cm-dropCursor':                                                                                                 { borderLeftColor: 'var(--rc-cm-key)' },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': { backgroundColor: 'var(--rc-cm-selection)' },
  '.cm-gutters':                                                                                                                {
    color:           'var(--rc-cm-gutter)',
    backgroundColor: 'var(--rc-cm-bg)',
    borderRight:     'none'
  },
  '.cm-activeLineGutter': { backgroundColor: 'transparent' },
  '.cm-rancher-key':      {
    color:      'var(--rc-cm-key)',
    fontWeight: '600'
  },
  '.cm-rancher-string':  { color: 'var(--rc-cm-string)' },
  '.cm-rancher-keyword': { color: 'var(--rc-cm-keyword)' },
  '.cm-rancher-comment': {
    color:     'var(--rc-cm-comment)',
    fontStyle: 'italic'
  }
});

export const rancherTheme: Extension = [
  rancherEditorTheme,
  syntaxHighlighting(rancherHighlight),
  yamlBooleanHighlight
];
