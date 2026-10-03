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

// The search panel's own styles use fixed light colors and small controls. Match the editor's colors and the
// Dashboard's inputs and secondary buttons. Selectors repeat the panel's own so these rules win.
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
    padding:  '4px 40px 4px 8px',
    fontSize: '14px'
  },
  // The panel lays its controls out inline. Give them all one height and middle alignment so labels line up with
  // the fields and buttons beside them.
  '.cm-panel.cm-search input, .cm-panel.cm-search button, .cm-panel.cm-search label': {
    margin:        '4px 8px 4px 0',
    verticalAlign: 'middle'
  },
  '.cm-textfield': {
    // The Dashboard's global form styles make inputs without a type full width blocks, which would leave the
    // field alone on its row with the close button at its end, as if it cleared the field
    display:         'inline-block',
    width:           '240px',
    maxWidth:        'calc(100% - 8px)',
    height:          '32px',
    boxSizing:       'border-box',
    padding:         '0 8px',
    fontSize:        'inherit',
    color:           'var(--input-text, inherit)',
    backgroundColor: 'var(--input-bg, transparent)',
    border:          '1px solid var(--input-border, #C4C8CF)',
    borderRadius:    'var(--border-radius, 4px)',
    '&:hover':       { borderColor: 'var(--input-hover-border, var(--input-border, #C4C8CF))' },
    '&:focus':       {
      outline:     'none',
      borderColor: 'var(--primary-border, var(--primary, #3D98D3))'
    }
  },
  // Matches RcButton's secondary variant
  '.cm-button': {
    height:             '32px',
    boxSizing:          'border-box',
    padding:            '0 12px',
    fontSize:           'inherit',
    color:              'var(--on-secondary, var(--primary, #3D98D3))',
    backgroundColor:    'var(--secondary, transparent)',
    backgroundImage:    'none',
    border:             '1px solid var(--secondary-border, var(--primary, #3D98D3))',
    borderRadius:       'var(--border-radius, 4px)',
    cursor:             'pointer',
    '&:hover, &:focus': { backgroundColor: 'var(--secondary-hover, transparent)' },
    '&:active':         { backgroundImage: 'none' }
  },
  '.cm-panel.cm-search label': {
    display:    'inline-flex',
    alignItems: 'center',
    gap:        '4px',
    height:     '32px',
    fontSize:   'inherit'
  },
  '.cm-panel.cm-search input[type=checkbox]': {
    margin:      '0',
    accentColor: 'var(--primary, #3D98D3)'
  },
  // Centered on the first row of controls
  '.cm-panel.cm-search [name=close]': {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    top:            '8px',
    right:          '4px',
    width:          '32px',
    height:         '32px',
    margin:         '0',
    color:          'var(--rc-cm-text)',
    fontSize:       '20px',
    lineHeight:     '1',
    borderRadius:   'var(--border-radius, 4px)',
    cursor:         'pointer',
    '&:hover':      {
      color:           'var(--primary, #3D98D3)',
      backgroundColor: 'var(--secondary-hover, transparent)'
    },
    // A tooltip naming the button, styled like the Dashboard's, below it so it lies over the code rather than past
    // the top of the editor. The panel's markup is not ours, so it shows the button's translated label.
    '&::after': {
      content:         'attr(aria-label)',
      position:        'absolute',
      top:             'calc(100% + 8px)',
      right:           '0',
      padding:         '8px',
      whiteSpace:      'nowrap',
      fontSize:        '14px',
      lineHeight:      '1.2',
      color:           'var(--tooltip-text, #141419)',
      backgroundColor: 'var(--tooltip-bg, #DCDEE7)',
      borderRadius:    'var(--border-radius, 4px)'
    },
    '&::before': {
      content:           '""',
      position:          'absolute',
      top:               'calc(100% - 6px)',
      right:             '9px',
      border:            '7px solid transparent',
      borderBottomColor: 'var(--tooltip-bg, #DCDEE7)'
    },
    '&::after, &::before': {
      opacity:       '0',
      visibility:    'hidden',
      pointerEvents: 'none',
      transition:    'opacity 0.15s, visibility 0.15s'
    },
    '&:hover::after, &:hover::before, &:focus-visible::after, &:focus-visible::before': {
      opacity:    '1',
      visibility: 'visible'
    }
  },
  '.cm-panel.cm-search input:focus-visible, .cm-panel.cm-search button:focus-visible': {
    outline:       '2px solid var(--primary-keyboard-focus, #3D98D3)',
    outlineOffset: '1px'
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
