/*
 * NOTE: This isn't actually a real plugin anymore, it's is dynamically loaded in components/CodeMirror.vue
 * so that it doesn't all get loaded put into vendor.js
 */

import Vue from 'vue';
import VueCodemirror from 'vue-codemirror';
import CodeMirror from 'codemirror';
import YAML from 'yaml';

import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/yaml/yaml.js';
// import 'codemirror/mode/dockerfile/dockerfile.js';
// import 'codemirror/mode/shell/shell.js';
// import 'codemirror/mode/markdown/markdown.js';

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
import 'codemirror/addon/fold/indent-fold.js';

import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/addon/hint/show-hint.js';
import 'codemirror/addon/hint/anyword-hint.js';

CodeMirror.registerHelper('lint', 'yaml', (text) => {
  const found = [];

  try {
    YAML.parse(text, { prettyErrors: true });
  } catch (e) {
    const start = e.linePos.start;
    const end = e.linePos.end || start;

    const from = CodeMirror.Pos(start.line - 1, start.col);
    const to = CodeMirror.Pos(end.line - 1, end.col);

    found.push({
      from, to, message: e.message
    });
  }

  return found;
});

Vue.use(VueCodemirror);
export default VueCodemirror;

function isLineComment(cm, lineNo) {
  return /\bcomment\b/.test(cm.getTokenTypeAt(CodeMirror.Pos(lineNo, 0)));
}

function lineIndent(cm, lineNo) {
  const text = cm.getLine(lineNo).substr(1);
  const spaceTo = text.search(/\S/);

  if (spaceTo === -1 ) {
    return -1;
  }

  const out = CodeMirror.countColumn(text, null, cm.getOption('tabSize'));

  return out;
}

CodeMirror.registerHelper('fold', 'yaml', (cm, start) => {
  if ( !isLineComment(cm, start.line) ) {
    return;
  }

  const myIndent = lineIndent(cm, start.line);

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

    const indent = lineIndent(cm, i);

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
