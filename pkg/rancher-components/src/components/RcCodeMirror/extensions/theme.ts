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

const rancherSharedTheme = EditorView.theme({
  '.cm-content':                { caretColor: 'var(--rc-cm-key)' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--rc-cm-key)' },
  '.cm-rancher-key':            {
    color:      'var(--rc-cm-key)',
    fontWeight: '600'
  },
  '.cm-rancher-string':  { color: 'var(--rc-cm-string)' },
  '.cm-rancher-keyword': { color: 'var(--rc-cm-keyword)' },
  '.cm-rancher-comment': {
    color:     'var(--rc-cm-comment)',
    fontStyle: 'italic'
  },
  '.cm-tooltip': {
    color:           'var(--rc-cm-text)',
    backgroundColor: 'var(--rc-cm-bg)',
    border:          '1px solid var(--rc-cm-gutter)',
    borderRadius:    '4px'
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    color:           'var(--primary-text, #FFFFFF)',
    backgroundColor: 'var(--primary, #3D98D3)'
  }
});

const rancherEditorTheme = EditorView.theme({
  '&': {
    color:           'var(--rc-cm-text)',
    backgroundColor: 'var(--rc-cm-bg)'
  },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': { backgroundColor: 'var(--rc-cm-selection)' },
  '.cm-gutters':                                                                                                                {
    color:           'var(--rc-cm-gutter)',
    backgroundColor: 'var(--rc-cm-bg)',
    borderRight:     'none'
  },
  '.cm-activeLineGutter': { backgroundColor: 'transparent' },
  // Only shown with highlightActiveLine(). Translucent, so the selection stays visible beneath it
  '.cm-activeLine':       { backgroundColor: 'var(--rc-cm-active-line)' },
  '.cm-foldPlaceholder':  {
    backgroundColor: 'transparent',
    border:          'none',
    borderRadius:    '0',
    color:           'inherit',
    fontSize:        '12px',
    fontStyle:       'normal',
    lineHeight:      '1',
    margin:          '0 1px',
    padding:         '0'
  }
});

// Keep the search controls in one Rancher-style input with a separate close action.
const rancherSearchTheme = EditorView.theme({
  '.cm-panels': {
    color:           'var(--rc-cm-text)',
    backgroundColor: 'var(--rc-cm-bg)',
    // Draw native controls such as the checkboxes for the editor's light or dark colors
    colorScheme:     'var(--rc-cm-color-scheme, light)'
  },
  '.cm-panels-top':                   { borderBottom: '1px solid var(--border, #DCDEE7)' },
  // A page can stick the panel below the top of its scroll area (a modal's padding, for example), leaving code
  // visible as it scrolls past above the panel. Mute that code with a translucent layer above the panel, clipped
  // to the editor so it never covers the page above it. Tooltips are fixed, so the clip leaves them be.
  '&:has(.cm-panels-top .cm-search)': { overflowY: 'clip' },
  '.cm-panels-top::before':           {
    content:         '""',
    position:        'absolute',
    bottom:          '100%',
    left:            '0',
    right:           '0',
    height:          '100vh',
    backgroundColor: 'color-mix(in srgb, var(--rc-cm-bg) 75%, transparent)',
    backdropFilter:  'blur(2px)',
    pointerEvents:   'none'
  },
  '.cm-panel.cm-search': {
    display:    'flex',
    alignItems: 'center',
    gap:        '8px',
    padding:    '8px 0',
    fontSize:   '14px'
  },
  '.cm-search-field': {
    display:          'flex',
    flex:             '1 1 auto',
    boxSizing:        'border-box',
    minWidth:         '0',
    height:           '36px',
    border:           '1px solid var(--input-border, #C4C8CF)',
    borderRadius:     'var(--border-radius, 4px)',
    backgroundColor:  'var(--input-bg, transparent)',
    '&:hover':        { borderColor: 'var(--input-hover-border, var(--input-border, #C4C8CF))' },
    '&:focus-within': {
      borderColor: 'var(--primary-border, var(--primary, #3D98D3))',
      boxShadow:   'inset 0 0 0 1px var(--primary-border, var(--primary, #3D98D3))'
    }
  },
  '.cm-panel.cm-search .cm-textfield': {
    display:         'block',
    flex:            '1 1 auto',
    boxSizing:       'border-box',
    minWidth:        '0',
    width:           '100%',
    height:          '100%',
    padding:         '0 8px',
    margin:          '0',
    fontSize:        'inherit',
    color:           'var(--input-text, inherit)',
    backgroundColor: 'transparent',
    border:          '0',
    outline:         'none',
    boxShadow:       'none'
  },
  '.cm-search-controls': {
    display:    'flex',
    alignItems: 'center',
    flex:       '0 0 auto',
    height:     '100%',
    gap:        '2px',
    padding:    '0 4px',
    color:      'var(--muted, #6B6D85)'
  },
  '.cm-search-count': {
    whiteSpace: 'nowrap',
    fontSize:   '12px',
    padding:    '0 2px'
  },
  '.cm-panel.cm-search .cm-search-controls button': {
    display:         'inline-flex',
    alignItems:      'center',
    justifyContent:  'center',
    width:           '24px',
    height:          '28px',
    minHeight:       '0',
    boxSizing:       'border-box',
    margin:          '0',
    padding:         '0',
    border:          '0',
    backgroundColor: 'transparent',
    color:           'inherit',
    lineHeight:      '1',
    cursor:          'pointer',
    '&:hover':       { color: 'var(--primary, #3D98D3)' },
    '&:disabled':    { opacity: '0.4', cursor: 'default' }
  },
  '.cm-search-icon':                  { padding: '0 5px' },
  '.cm-panel.cm-search [name=close]': {
    position:        'static',
    flex:            '0 0 auto',
    margin:          '0',
    padding:         '0 6px',
    height:          '32px',
    minHeight:       '0',
    border:          '0',
    backgroundColor: 'transparent',
    color:           'var(--rc-cm-text)',
    fontSize:        '12px',
    lineHeight:      '1',
    cursor:          'pointer',
    '&:hover':       { color: 'var(--primary, #3D98D3)' }
  },
  '.cm-panel.cm-search button:focus-visible': {
    outline:       '2px solid var(--primary-keyboard-focus, #3D98D3)',
    outlineOffset: '-2px'
  },
  '.cm-searchMatch':          { backgroundColor: 'var(--rc-cm-search-match)' },
  '.cm-searchMatch-selected': { backgroundColor: 'var(--rc-cm-search-match-selected)' }
});

const rancherInputCursorTheme = EditorView.theme({ '.cm-cursor, .cm-dropCursor': { borderLeftWidth: '2px' } });

const rancherHighlighting = syntaxHighlighting(rancherHighlight);
const rancherSyntax: Extension = [rancherSharedTheme, rancherHighlighting, yamlBooleanHighlight];

export const rancherTheme: Extension = [
  rancherEditorTheme,
  rancherSearchTheme,
  rancherSyntax
];

export const rancherInputTheme: Extension = [
  rancherInputCursorTheme,
  rancherSyntax
];
