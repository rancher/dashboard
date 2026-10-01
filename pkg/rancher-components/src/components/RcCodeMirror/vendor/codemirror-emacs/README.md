# CodeMirror Emacs keymap

This is the ESM build and TypeScript declaration from [`@replit/codemirror-emacs` 6.1.0](https://www.npmjs.com/package/@replit/codemirror-emacs), under the included MIT license.

`index.js` removes the `/*@__PURE__*/` annotations on the `EmacsHandler.bindKey` and `EmacsHandler.addCommands` calls. Those calls register the key bindings and commands, so production minifiers must retain them. The unmodified package drops them in a minified build.

`index.js` also maps the `Semicolon`, `Comma` and `Period` key codes to their characters in `specialKey`. Keys are looked up by physical key code, and without these entries the `M-;` (toggle comment), `S-M-,` (start of document) and `S-M-.` (end of document) bindings never match.

`killRingSave` (`M-w`) also clears the mark after copying, as CodeMirror 5 did. Without it the mark stays active, so the next cursor movement selects text and the next yank or typed character replaces it.

The handler also restores CodeMirror 5 behavior for `C-j`, `M-c`, `M-Space`, `C-Up`, `C-Down`, `Tab`, `Shift-Tab`, and YAML `Enter`. The `tabIndent` option leaves Tab and Shift-Tab to browser focus navigation in the input variant. CodeMirror 5's YAML mode indented the new line to the previous line and replaced any leading space after the cursor; other languages continue to use CodeMirror 6's language indentation. CodeMirror 6 lets users press Escape then Tab to leave the editor. `C-s` and `C-r` are unbound here. The fallback keymap in `extensions/keymaps.ts` binds `C-s` to open CodeMirror's search panel, and omits `Cmd-/`, `Alt-Up`, and `Alt-Down` in Emacs mode.

`Backspace` deletes both brackets of an empty pair (such as `[]` or `{}`) before falling back to deleting a single character, matching the other keymaps. The Emacs keydown handler runs before CodeMirror's keymaps, so `closeBracketsKeymap` alone never sees the key.
