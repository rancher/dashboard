/*
 * NOTE: This isn't actually a real plugin anymore, it's is dynamically loaded in components/CodeMirror.vue
 * so that it doesn't all get loaded put into vendor.js
 */

import CodeMirror from 'codemirror';

import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/yaml/yaml.js';
import 'codemirror/mode/javascript/javascript.js';

import 'codemirror/theme/base16-light.css';
import 'codemirror/theme/base16-dark.css';

import 'codemirror/keymap/vim.js';
import 'codemirror/keymap/emacs.js';
import 'codemirror/keymap/sublime.js';

import 'codemirror/addon/lint/lint.css';
import 'codemirror/addon/lint/lint.js';
import 'codemirror/addon/lint/yaml-lint.js';

import 'codemirror/addon/fold/foldgutter.css';
import 'codemirror/addon/fold/foldgutter.js';

import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/addon/hint/show-hint.js';
import 'codemirror/addon/hint/anyword-hint.js';

import { strPad } from '@shell/utils/string';

function isLineComment(cm, lineNo) {
  return /\bcomment\b/.test(cm.getTokenTypeAt(CodeMirror.Pos(lineNo, 0)));
}

function commentIndent(cm, lineNo) {
  const text = cm.getLine(lineNo).substr(1);
  const spaceTo = text.search(/\S/);

  if (spaceTo === -1 ) {
    return -1;
  }

  const out = CodeMirror.countColumn(text, null, cm.getOption('tabSize'));

  return out;
}

// Like the regular indent in codemirror, but treat a YAML array
// item that's at the same level as the parent key as intented on level more
//
// foo:
// - a
// - b
function lineIndent(cm, lineNo) {
  let text = cm.getLine(lineNo);
  const match = text.match(/(\s*(-\s+)?)(\S.*)/);

  if ( !match ) {
    return -1;
  }

  const spaceTo = match[1].length;

  text = strPad('', spaceTo) + match[3];

  if ( /\bcomment\b/.test(cm.getTokenTypeAt(CodeMirror.Pos(lineNo, spaceTo + 1)))) {
    return -1;
  }

  return CodeMirror.countColumn(text, null, cm.getOption('tabSize'));
}

// https://github.com/codemirror/CodeMirror/blob/master/addon/fold/indent-fold.js
CodeMirror.registerHelper('fold', 'indent', (cm, start) => {
  const myIndent = lineIndent(cm, start.line);

  if (myIndent < 0) {
    return;
  }
  let lastLineInFold = null;

  // Go through lines until we find a line that definitely doesn't belong in
  // the block we're folding, or to the end.
  for (let i = start.line + 1, end = cm.lastLine(); i <= end; ++i) {
    const indent = lineIndent(cm, i);

    if (indent === -1) {
    } else if (indent > myIndent) {
      // Lines with a greater indent are considered part of the block.
      lastLineInFold = i;
    } else {
      // If this line has non-space, non-comment content, and is
      // indented less or equal to the start line, it is the start of
      // another block.
      break;
    }
  }
  if (lastLineInFold) {
    return {
      from: CodeMirror.Pos(start.line, cm.getLine(start.line).length),
      to:   CodeMirror.Pos(lastLineInFold, cm.getLine(lastLineInFold).length)
    };
  }
});

CodeMirror.defineExtension('foldLinesMatching', function(regex) {
  this.operation(() => {
    for (let i = this.firstLine(), e = this.lastLine(); i <= e; i++) {
      const line = this.getLine(i);

      if ( line.match(regex) ) {
        this.foldCode(CodeMirror.Pos(i, 0), null, 'fold');
      }
    }
  });
});

function countSpaces(line) {
  for (let i = 0; i < line.length; i++) {
    if (line[i] !== ' ') {
      return i;
    }
  }

  return line.length;
}

CodeMirror.defineExtension('foldYaml', function(path) {
  this.operation(() => {
    let elements = [];

    for (let i = this.firstLine(), e = this.lastLine(); i <= e; i++) {
      const line = this.getLine(i);
      const index = countSpaces(line);
      const trimmed = line.trim();

      if (trimmed.endsWith(':') || trimmed.endsWith(': >-')) {
        const name = trimmed.split(':')[0].substr(0, trimmed.length - 1);

        // Remove all elements of the same are greater index
        elements = elements.filter((e) => e.index < index);

        // Add on this one
        elements.push({
          index,
          name
        });

        const currentPath = elements.map((e) => e.name).join('.');

        if (currentPath === path) {
          this.foldCode(CodeMirror.Pos(i, 0), null, 'fold');
        }
      }
    }
  });
});

CodeMirror.registerHelper('fold', 'yamlcomments', (cm, start) => {
  if ( !isLineComment(cm, start.line) ) {
    return;
  }

  const myIndent = commentIndent(cm, start.line);

  if (myIndent < 0) {
    return;
  }

  let lastLineInFold = null;

  // Go through lines until we find a line that definitely doesn't belong in
  // the block we're folding, or to the end.
  for (let i = start.line + 1, end = cm.lastLine(); i <= end; ++i) {
    if ( !isLineComment(cm, i) ) {
      break;
    }

    const indent = commentIndent(cm, i);

    if (indent === -1) {
      // empty?
    } else if (indent > myIndent) {
      // Lines with a greater indent are considered part of the block.
      lastLineInFold = i;
    } else {
      // If this line has non-space, non-comment content, and is
      // indented less or equal to the start line, it is the start of
      // another block.
      break;
    }
  }

  if (lastLineInFold) {
    return {
      from: CodeMirror.Pos(start.line, cm.getLine(start.line).length),
      to:   CodeMirror.Pos(lastLineInFold, cm.getLine(lastLineInFold).length)
    };
  }
});

/**
 * It display a dot for each space character in the text;
 * used in combination with 'as-text-area' css properties in CodeMirror.vue to display line break markdowns
 */
CodeMirror.defineOption('showMarkdownLineBreaks', false, (codeMirror) => {
  codeMirror.addOverlay({
    name:  'show-markdown-line-breaks',
    token: (stream) => {
      if (stream.string[stream.pos].match(/\s/)) {
        stream.next();

        return stream.pos % 2 === 0 ? 'markdown-single-trailing-space-even' : 'markdown-single-trailing-space-odd';
      }

      stream.next();

      return null;
    }
  });
});

/**
 * It enables the text color selection in CodeMirror.vue
 * references:
 *   demo:   https://codemirror.net/5/demo/markselection.html#
 *   add-on: https://codemirror.net/5/doc/manual.html#addon_mark-selection
 *   source: https://codemirror.net/5/addon/selection/mark-selection.js
 */
CodeMirror.defineOption('styleSelectedText', false, (cm, val, old) => {
  const prev = old && old !== CodeMirror.Init;

  if (val && !prev) {
    cm.state.markedSelection = [];
    cm.state.markedSelectionStyle = typeof val === 'string' ? val : 'CodeMirror-selectedtext';
    reset(cm);
    cm.on('cursorActivity', onCursorActivity);
    cm.on('change', onChange);
  } else if (!val && prev) {
    cm.off('cursorActivity', onCursorActivity);
    cm.off('change', onChange);
    clear(cm);
    cm.state.markedSelection = cm.state.markedSelectionStyle = null;
  }
});

function onCursorActivity(cm) {
  if (cm.state.markedSelection) {
    cm.operation(() => {
      update(cm);
    });
  }
}

function onChange(cm) {
  if (cm.state.markedSelection && cm.state.markedSelection.length) {
    cm.operation(() => {
      clear(cm);
    });
  }
}

const CHUNK_SIZE = 8;
const Pos = CodeMirror.Pos;
const cmp = CodeMirror.cmpPos;

function coverRange(cm, from, to, addAt) {
  if (cmp(from, to) === 0) {
    return;
  }
  const array = cm.state.markedSelection;
  const cls = cm.state.markedSelectionStyle;

  for (let line = from.line;;) {
    const start = line === from.line ? from : Pos(line, 0);
    const endLine = line + CHUNK_SIZE; const atEnd = endLine >= to.line;
    const end = atEnd ? to : Pos(endLine, 0);
    const mark = cm.markText(start, end, { className: cls });

    if (addAt === null || addAt === undefined) {
      array.push(mark);
    } else {
      array.splice(addAt++, 0, mark);
    }
    if (atEnd) {
      break;
    }
    line = endLine;
  }
}

function clear(cm) {
  const array = cm.state.markedSelection;

  for (let i = 0; i < array.length; ++i) {
    array[i].clear();
  }
  array.length = 0;
}

function reset(cm) {
  clear(cm);
  const ranges = cm.listSelections();

  for (let i = 0; i < ranges.length; i++) {
    coverRange(cm, ranges[i].from(), ranges[i].to());
  }
}

function update(cm) {
  if (!cm.somethingSelected()) {
    return clear(cm);
  }
  if (cm.listSelections().length > 1) {
    return reset(cm);
  }

  const from = cm.getCursor('start'); const to = cm.getCursor('end');

  const array = cm.state.markedSelection;

  if (!array.length) {
    return coverRange(cm, from, to);
  }

  let coverStart = array[0].find(); let coverEnd = array[array.length - 1].find();

  if (!coverStart || !coverEnd || to.line - from.line <= CHUNK_SIZE ||
      cmp(from, coverEnd.to) >= 0 || cmp(to, coverStart.from) <= 0) {
    return reset(cm);
  }

  while (cmp(from, coverStart.from) > 0) {
    array.shift().clear();
    coverStart = array[0].find();
  }
  if (cmp(from, coverStart.from) < 0) {
    if (coverStart.to.line - from.line < CHUNK_SIZE) {
      array.shift().clear();
      coverRange(cm, from, coverStart.to, 0);
    } else {
      coverRange(cm, from, coverStart.from, 0);
    }
  }

  while (cmp(to, coverEnd.to) < 0) {
    array.pop().clear();
    coverEnd = array[array.length - 1].find();
  }
  if (cmp(to, coverEnd.to) > 0) {
    if (to.line - coverEnd.from.line < CHUNK_SIZE) {
      array.pop().clear();
      coverRange(cm, coverEnd.from, to);
    } else {
      coverRange(cm, coverEnd.to, to);
    }
  }
}
