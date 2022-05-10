/*
 * NOTE: This isn't actually a real plugin anymore, it's is dynamically loaded in components/CodeMirror.vue
 * so that it doesn't all get loaded put into vendor.js
 */

import Vue from 'vue';
import VueCodemirror from 'vue-codemirror';
import CodeMirror from 'codemirror';

import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/yaml/yaml.js';
import 'codemirror/mode/javascript/javascript.js';

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

import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/addon/hint/show-hint.js';
import 'codemirror/addon/hint/anyword-hint.js';

import { strPad } from '@shell/utils/string';

Vue.use(VueCodemirror);
export default VueCodemirror;

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
