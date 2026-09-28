# CodeMirror Emacs keymap

This is the ESM build and TypeScript declaration from [`@replit/codemirror-emacs` 6.1.0](https://www.npmjs.com/package/@replit/codemirror-emacs), under the included MIT license.

The only changes to `index.js` are removal of the `/*@__PURE__*/` annotations on the `EmacsHandler.bindKey` and `EmacsHandler.addCommands` calls. Those calls register the key bindings and commands, so production minifiers must retain them. The unmodified package drops them in a minified build.

`index.js` also maps the `Semicolon`, `Comma` and `Period` key codes to their characters in `specialKey`. Keys are looked up by physical key code, and without these entries the `M-;` (toggle comment), `S-M-,` (start of document) and `S-M-.` (end of document) bindings never match.
