import { Prec, StateEffect, StateField, MapMode, EditorSelection, Facet } from '@codemirror/state';
import * as View from '@codemirror/view';
import { EditorView, Direction, ViewPlugin, showPanel } from '@codemirror/view';
import * as commands from '@codemirror/commands';
import { completionStatus, deleteBracketPair, startCompletion } from '@codemirror/autocomplete';
import { yamlLanguage } from '@codemirror/lang-yaml';

// backwards compatibility for old versions not supporting getDrawSelectionConfig
let getDrawSelectionConfig = View.getDrawSelectionConfig || /*@__PURE__*/function () {
    let defaultConfig = { cursorBlinkRate: 1200 };
    return function () {
        return defaultConfig;
    };
}();
class Piece {
    constructor(left, top, height, fontFamily, fontSize, fontWeight, color, className, letter, partial) {
        this.left = left;
        this.top = top;
        this.height = height;
        this.fontFamily = fontFamily;
        this.fontSize = fontSize;
        this.fontWeight = fontWeight;
        this.color = color;
        this.className = className;
        this.letter = letter;
        this.partial = partial;
    }
    draw() {
        let elt = document.createElement("div");
        elt.className = this.className;
        this.adjust(elt);
        return elt;
    }
    adjust(elt) {
        elt.style.left = this.left + "px";
        elt.style.top = this.top + "px";
        elt.style.height = this.height + "px";
        elt.style.lineHeight = this.height + "px";
        elt.style.fontFamily = this.fontFamily;
        elt.style.fontSize = this.fontSize;
        elt.style.fontWeight = this.fontWeight;
        elt.style.color = this.partial ? "transparent" : this.color;
        elt.className = this.className;
        elt.textContent = this.letter;
    }
    eq(p) {
        return this.left == p.left && this.top == p.top && this.height == p.height &&
            this.fontFamily == p.fontFamily && this.fontSize == p.fontSize &&
            this.fontWeight == p.fontWeight && this.color == p.color &&
            this.className == p.className &&
            this.letter == p.letter;
    }
}
class BlockCursorPlugin {
    constructor(view, em) {
        this.view = view;
        this.rangePieces = [];
        this.cursors = [];
        this.em = em;
        this.measureReq = { read: this.readPos.bind(this), write: this.drawSel.bind(this) };
        this.cursorLayer = view.scrollDOM.appendChild(document.createElement("div"));
        this.cursorLayer.className = "cm-cursorLayer cm-vimCursorLayer";
        this.cursorLayer.setAttribute("aria-hidden", "true");
        view.requestMeasure(this.measureReq);
        this.setBlinkRate();
    }
    setBlinkRate() {
        let config = getDrawSelectionConfig(this.view.state);
        let blinkRate = config.cursorBlinkRate;
        this.cursorLayer.style.animationDuration = blinkRate + "ms";
    }
    update(update) {
        if (update.selectionSet || update.geometryChanged || update.viewportChanged) {
            this.view.requestMeasure(this.measureReq);
            this.cursorLayer.style.animationName = this.cursorLayer.style.animationName == "cm-blink" ? "cm-blink2" : "cm-blink";
        }
        if (configChanged(update))
            this.setBlinkRate();
    }
    scheduleRedraw() {
        this.view.requestMeasure(this.measureReq);
    }
    readPos() {
        let { state } = this.view;
        let cursors = [];
        for (let r of state.selection.ranges) {
            let prim = r == state.selection.main;
            let piece = measureCursor(this.em, this.view, r, prim);
            if (piece)
                cursors.push(piece);
        }
        return { cursors };
    }
    drawSel({ cursors }) {
        if (cursors.length != this.cursors.length || cursors.some((c, i) => !c.eq(this.cursors[i]))) {
            let oldCursors = this.cursorLayer.children;
            if (oldCursors.length !== cursors.length) {
                this.cursorLayer.textContent = "";
                for (const c of cursors)
                    this.cursorLayer.appendChild(c.draw());
            }
            else {
                cursors.forEach((c, idx) => c.adjust(oldCursors[idx]));
            }
            this.cursors = cursors;
        }
    }
    destroy() {
        this.cursorLayer.remove();
    }
}
function configChanged(update) {
    return getDrawSelectionConfig(update.startState) != getDrawSelectionConfig(update.state);
}
const themeSpec = {
    ".cm-line": {
        "& ::selection": { backgroundColor: "transparent !important" },
        "&::selection": { backgroundColor: "transparent !important" },
        caretColor: "transparent !important",
    },
    ".cm-fat-cursor": {
        position: "absolute",
        background: "#ff9696",
        border: "none",
        whiteSpace: "pre",
    },
    "&:not(.cm-focused) .cm-fat-cursor": {
        background: "none",
        outline: "solid 1px #ff9696",
        color: "transparent !important",
    },
};
const hideNativeSelection = /*@__PURE__*/Prec.highest(/*@__PURE__*/EditorView.theme(themeSpec));
function getBase(view) {
    let rect = view.scrollDOM.getBoundingClientRect();
    let left = view.textDirection == Direction.LTR ? rect.left : rect.right - view.scrollDOM.clientWidth;
    return { left: left - view.scrollDOM.scrollLeft, top: rect.top - view.scrollDOM.scrollTop };
}
function measureCursor(em, view, cursor, primary) {
    var _a, _b;
    let head = cursor.head;
    let hCoeff = 1;
    if (em.$data.count || em.$data.keyChain) {
        hCoeff = 0.5;
    }
    {
        let letter = head < view.state.doc.length && view.state.sliceDoc(head, head + 1);
        if (letter && (/[\uDC00-\uDFFF]/.test(letter) && head > 1)) {
            // step back if cursor is on the second half of a surrogate pair
            head--;
            letter = view.state.sliceDoc(head, head + 1);
        }
        let pos = view.coordsAtPos(head, 1);
        if (!pos)
            return null;
        let base = getBase(view);
        let domAtPos = view.domAtPos(head);
        let node = domAtPos ? domAtPos.node : view.contentDOM;
        while (domAtPos && domAtPos.node instanceof HTMLElement) {
            node = domAtPos.node;
            domAtPos = { node: domAtPos.node.childNodes[domAtPos.offset], offset: 0 };
        }
        if (!(node instanceof HTMLElement)) {
            if (!node.parentNode)
                return null;
            node = node.parentNode;
        }
        let style = getComputedStyle(node);
        let left = pos.left;
        // TODO remove coordsAtPos when all supported versions of codemirror have coordsForChar api
        let charCoords = (_b = (_a = view).coordsForChar) === null || _b === void 0 ? void 0 : _b.call(_a, head);
        if (charCoords) {
            left = charCoords.left;
        }
        if (!letter || letter == "\n" || letter == "\r") {
            letter = "\xa0";
        }
        else if (letter == "\t") {
            letter = "\xa0";
            var nextPos = view.coordsAtPos(head + 1, -1);
            if (nextPos) {
                left = nextPos.left - (nextPos.left - pos.left) / parseInt(style.tabSize);
            }
        }
        else if ((/[\uD800-\uDBFF]/.test(letter) && head < view.state.doc.length - 1)) {
            // include the second half of a surrogate pair in cursor
            letter += view.state.sliceDoc(head + 1, head + 2);
        }
        let h = (pos.bottom - pos.top);
        return new Piece(left - base.left, pos.top - base.top + h * (1 - hCoeff), h * hCoeff, style.fontFamily, style.fontSize, style.fontWeight, style.color, primary ? "cm-fat-cursor cm-cursor-primary" : "cm-fat-cursor cm-cursor-secondary", letter, hCoeff != 1);
    }
}

const emacsStyle = /*@__PURE__*/EditorView.theme({
    ".cm-emacsMode .cm-cursorLayer:not(.cm-vimCursorLayer)": {
        display: "none",
    },
    ".cm-vim-panel": {
        padding: "5px 10px",
        backgroundColor: "#fffa8f",
        fontFamily: "monospace",
    },
    ".cm-vim-panel input": {
        border: "none",
        outline: "none",
        backgroundColor: "#fffa8f",
    },
});
const emacsPlugin = /*@__PURE__*/ViewPlugin.fromClass(class {
    constructor(view) {
        this.status = "";
        this.view = view;
        this.em = new EmacsHandler(view);
        this.blockCursor = new BlockCursorPlugin(view, this.em);
        this.view.scrollDOM.classList.add("cm-emacsMode");
        /*this.em.on("dialog", () => {
          view.dispatch({
            effects: showEmacsPanel.of(!!this.cm.state.dialog)
          })
        });*/
    }
    update(update) {
        if (update.docChanged) {
            this.em.$emacsMark = null;
            this.em.updateMarksOnChange(update.changes);
        }
        /*if (update.selectionSet) {
          this.em.onSelectionChange()
        }
        if (update.viewportChanged) {
          // scroll
        }
        if (this.em.curOp && !this.em.curOp.isVimOp) {
          this.em.onBeforeEndOperation();
        }/**/
        this.blockCursor.update(update);
    }
    destroy() {
        this.view.scrollDOM.classList.remove("cm-emacsMode");
        this.blockCursor.destroy();
    }
}, {
    eventHandlers: {
        keydown: function (e, view) {
            var result = this.em.handleKeyboard(e);
            if (result)
                this.blockCursor.scheduleRedraw();
            return !!result;
        },
        mousedown: function () {
            this.em.$emacsMark = null;
        }
    },
});
const emacsTabIndent = /*@__PURE__*/Facet.define({ combine: inputs => inputs[0] ?? true });
const showVimPanel = /*@__PURE__*/StateEffect.define();
const vimPanelState = /*@__PURE__*/StateField.define({
    create: () => false,
    update(value, tr) {
        for (let e of tr.effects)
            if (e.is(showVimPanel))
                value = e.value;
        return value;
    },
    provide: f => {
        return showPanel.from(f, on => on ? createVimPanel : null);
    }
});
function createVimPanel(view) {
    let dom = document.createElement("div");
    dom.className = "cm-vim-panel";
    return { top: false, dom };
}
function emacs(options = {}) {
    return [
        emacsTabIndent.of(options.tabIndent !== false),
        emacsStyle,
        emacsPlugin,
        hideNativeSelection,
        vimPanelState
    ];
}
var specialKey = {
    Return: 'Return', Escape: 'Esc', Insert: 'Ins',
    ArrowLeft: 'Left', ArrowRight: 'Right', ArrowUp: 'Up', ArrowDown: 'Down',
    Enter: 'Return', Divide: '/', Slash: '/', Multiply: '*',
    Subtract: '-', Minus: "-", Equal: '=',
    Semicolon: ';', Comma: ',', Period: '.',
};
var ignoredKeys = { Shift: 1, Alt: 1, Command: 1, Control: 1, CapsLock: 1 };
const commandKeyBinding = {};
class EmacsHandler {
    constructor(view) {
        this.view = view;
        // commands
        this.$data = {
            count: 0,
            keyChain: "",
            lastCommand: ""
        };
        // mark
        this.$emacsMarkRing = [];
        this.$emacsMark = null;
    }
    static bindKey(keyGroup, command) {
        keyGroup.split("|").forEach(function (binding) {
            let chain = "";
            let parts = binding.split(/\s+/);
            parts.forEach(function (keyGroup, index) {
                let modifiers = keyGroup.split(/-(?=.)/);
                let key = modifiers.pop();
                if (modifiers.length) {
                    chain += modifiers.sort().join("-") + "-";
                }
                chain += key;
                if (index === parts.length - 1) {
                    commandKeyBinding[chain] = command;
                }
                else {
                    commandKeyBinding[chain] = "null";
                    chain += " ";
                }
            });
        });
    }
    static getKey(e) {
        var code = e.code;
        var key = e.key;
        if (ignoredKeys[key])
            return ['', '', ''];
        if (code.length > 1) {
            if (code[0] == "N")
                code = code.replace(/^Numpad/, "");
            if (code[0] == "K")
                code = code.replace(/^Key/, "");
        }
        code = specialKey[code] || code;
        if (code.length == 1)
            code = code.toLowerCase();
        var modifier = '';
        if (e.ctrlKey) {
            modifier += 'C-';
        }
        if (e.metaKey) {
            modifier += 'CMD-';
        }
        if (e.altKey) {
            modifier += 'M-';
        }
        if (e.shiftKey) {
            modifier += 'S-';
        }
        return [code, modifier, key];
    }
    static addCommands(commands) {
        Object.keys(commands).forEach(function (name) {
            var command = commands[name];
            if (typeof command == "function") {
                command = { exec: command };
            }
            EmacsHandler.commands[name] = command;
        });
    }
    static execCommand(command, handler, args, count = 1) {
        var commandResult = undefined;
        if (count < 0)
            count = -count;
        if (typeof command === "function") {
            for (var i = 0; i < count; i++)
                command(handler.view);
        }
        else if (command === "null") ;
        else if (command.exec) {
            if (count > 1 && command.handlesCount) {
                if (!args)
                    args = {};
                if (typeof args === 'object')
                    args.count = count;
                count = 1;
            }
            for (var i = 0; i < count; i++)
                commandResult = command.exec(handler, args || {});
        }
        else {
            throw new Error("missformed command");
        }
        return commandResult;
    }
    ;
    handleKeyboard(e) {
        var keyData = EmacsHandler.getKey(e);
        var result = this.findCommand(keyData);
        if (/Up|Down/.test(keyData === null || keyData === void 0 ? void 0 : keyData[0]) && completionStatus(this.view.state))
            return;
        if (result && result.command) {
            var commandResult = EmacsHandler.execCommand(result.command, this, result.args, result.count);
            if (commandResult === false)
                return;
        }
        return result;
    }
    findCommand([key, modifier, text]) {
        // if keyCode == -1 a non-printable key was pressed, such as just
        // control. Handling those is currently not supported in this handler
        if (!key)
            return undefined;
        // A read-only document has nothing to indent, so Tab and Shift-Tab move focus
        if (key == "Tab" && (modifier == "" || modifier == "S-") && (!this.view.state.facet(emacsTabIndent) || this.view.state.readOnly))
            return undefined;
        var editor = this;
        var data = this.$data;
        // editor._signal("changeStatus");
        // insertstring data.count times
        if (!modifier && key.length == 1) {
            editor.pushEmacsMark();
            if (data.count) {
                var str = new Array(data.count + 1).join(text);
                data.count = null;
                return { command: "insertstring", args: str };
            }
        }
        // CTRL + number / universalArgument for setting data.count
        if (modifier == "C-" || data.count) {
            var count = parseInt(key[key.length - 1]);
            if (typeof count === 'number' && !isNaN(count)) {
                data.count = Math.max(data.count || 0, 0);
                data.count = 10 * data.count + count;
                return { command: "null" };
            }
        }
        // this.commandKeyBinding maps key specs like "c-p" (for CTRL + P) to
        // command objects, for lookup key needs to include the modifier
        if (modifier)
            key = modifier + key;
        // Key combos like CTRL+X H build up the data.keyChain
        if (data.keyChain)
            key = data.keyChain += " " + key;
        // Key combo prefixes get stored as "null" (String!) in this
        // this.commandKeyBinding. When encountered no command is invoked but we
        // buld up data.keyChain
        var command = commandKeyBinding[key];
        data.keyChain = command == "null" ? key : "";
        // there really is no command
        if (!command)
            return undefined;
        // we pass b/c of key combo or universalArgument
        if (command === "null")
            return { command: "null" };
        if (command === "universalArgument") {
            // if no number pressed emacs repeats action 4 times.
            // minus sign is needed to allow next keypress to replace it
            data.count = -4;
            return { command: "null" };
        }
        // lookup command
        // TODO extract special handling of markmode
        // TODO special case command.command is really unnecessary, remove
        var args;
        if (typeof command !== "string") {
            args = command.args;
            if (command.command)
                command = command.command;
        }
        if (command === "insertstring" ||
            command === commands.splitLine ||
            command === commands.toggleComment) {
            editor.pushEmacsMark();
        }
        if (typeof command === "string") {
            command = EmacsHandler.commands[command];
            if (!command)
                return undefined;
        }
        if (!command.readOnly && !command.keepLastCommand) {
            data.lastCommand = null;
        }
        var count = data.count || 1;
        if (data.count)
            data.count = 0;
        return { command, args, count };
    }
    showCommandLine(text) {
        console.error("TODO");
    }
    updateMarksOnChange(change) {
        if (this.$emacsMark) {
            this.$emacsMark = this.updateMark(this.$emacsMark, change);
        }
        this.$emacsMarkRing = this.$emacsMarkRing.map(x => {
            return this.updateMark(x, change);
        }).filter(Boolean);
    }
    updateMark(mark, change) {
        if (!mark)
            return;
        var updated = mark.map(function (x) {
            return change.mapPos(x, 1, MapMode.TrackDel);
        }).filter(x => x != null);
        return updated.length == 0 ? null : updated;
    }
    emacsMark() {
        return this.$emacsMark;
    }
    ;
    setEmacsMark(p) {
        // to deactivate pass in a falsy value
        this.$emacsMark = p;
    }
    ;
    pushEmacsMark(p, activate) {
        var prevMark = this.$emacsMark;
        if (prevMark)
            pushUnique(this.$emacsMarkRing, prevMark);
        if (!p || activate)
            this.setEmacsMark(p);
        else
            pushUnique(this.$emacsMarkRing, p);
    }
    ;
    popEmacsMark() {
        var mark = this.emacsMark();
        if (mark) {
            this.setEmacsMark(null);
            return mark;
        }
        return this.$emacsMarkRing.pop();
    }
    ;
    getLastEmacsMark() {
        return this.$emacsMark || this.$emacsMarkRing.slice(-1)[0];
    }
    ;
    getCopyText() {
        var state = this.view.state;
        return state.selection.ranges.map(r => state.sliceDoc(r.from, r.to)).join("\n");
    }
    clearSelection() {
        var view = this.view;
        var selection = view.state.selection;
        var isEmpty = !selection.ranges.some(r => r.from != r.to);
        if (isEmpty)
            return false;
        var newRanges = selection.ranges.map(x => {
            return EditorSelection.range(x.head, x.head);
        });
        view.dispatch({
            selection: EditorSelection.create(newRanges, selection.mainIndex)
        });
        return true;
    }
    onPaste(text) {
        var view = this.view;
        var selection = view.state.selection;
        var linesToInsert;
        if (selection.ranges.length > 1) {
            var lines = text.split("\n");
            if (lines.length == selection.ranges.length) {
                linesToInsert = lines;
            }
        }
        var i = 0;
        var specs = view.state.changeByRange((range) => {
            var toInsert = linesToInsert ? linesToInsert[i] : text;
            i++;
            return {
                changes: { from: range.from, to: range.to, insert: toInsert },
                range: EditorSelection.cursor(range.from + toInsert.length)
            };
        });
        view.dispatch(specs);
    }
    selectionToEmacsMark() {
        var selection = this.view.state.selection;
        return selection.ranges.map(x => x.head);
    }
}
EmacsHandler.commands = {};
function pushUnique(array, item) {
    if (array.length && array[array.length - 1] + "" == item + "")
        return;
    array.push(item);
}
function insertEmacsNewline(view) {
    var state = view.state;
    if (state.readOnly)
        return false;
    if (!yamlLanguage.isActiveAt(state, state.selection.main.head))
        return commands.insertNewlineAndIndent(view);
    var changes = state.changeByRange((range) => {
        var line = state.doc.lineAt(range.from);
        var prefix = line.text.slice(0, range.from - line.from);
        var indent = /^\s*/.exec(prefix)[0];
        var to = range.to;
        var endLine = state.doc.lineAt(to);
        while (to < endLine.to && /\s/.test(state.doc.sliceString(to, to + 1)))
            to++;
        return {
            changes: { from: range.from, to, insert: state.lineBreak + indent },
            range: EditorSelection.cursor(range.from + state.lineBreak.length + indent.length)
        };
    });
    view.dispatch(state.update(changes, { scrollIntoView: true, userEvent: "input" }));
    return true;
}
const emacsKeys = {
    // movement
    "Up|C-p": { command: "goOrSelect", args: [commands.cursorLineUp, commands.selectLineUp] },
    "Down|C-n": { command: "goOrSelect", args: [commands.cursorLineDown, commands.selectLineDown] },
    "Left|C-b": { command: "goOrSelect", args: [commands.cursorCharBackward, commands.selectCharBackward] },
    "Right|C-f": { command: "goOrSelect", args: [commands.cursorCharForward, commands.selectCharForward] },
    "C-Left|M-b": { command: "goOrSelect", args: [commands.cursorGroupLeft, commands.selectGroupLeft] },
    "C-Right|M-f": { command: "goOrSelect", args: [commands.cursorGroupRight, commands.selectGroupRight] },
    "Home|C-a": { command: "goOrSelect", args: [commands.cursorLineStart, commands.selectLineStart] },
    "End|C-e": { command: "goOrSelect", args: [commands.cursorLineEnd, commands.selectLineEnd] },
    "C-Home|S-M-,": { command: "goOrSelect", args: [commands.cursorDocStart, commands.selectDocStart] },
    "C-End|S-M-.": { command: "goOrSelect", args: [commands.cursorDocEnd, commands.selectDocEnd] },
    // selection
    "S-Up|S-C-p": commands.selectLineUp,
    "S-Down|S-C-n": commands.selectLineDown,
    "S-Left|S-C-b": commands.selectCharBackward,
    "S-Right|S-C-f": commands.selectCharForward,
    "S-C-Left|S-M-b": commands.selectGroupBackward,
    "S-C-Right|S-M-f": commands.selectGroupForward,
    "S-Home|S-C-a": commands.selectLineStart,
    "S-End|S-C-e": commands.selectLineEnd,
    "S-C-Home": commands.selectDocStart,
    "S-C-End": commands.selectDocEnd,
    "C-l": "recenterTopBottom",
    "M-s": "centerSelection",
    "M-g": "gotoline",
    "C-x C-p|C-x h": commands.selectAll,
    "PageDown|C-v": { command: "goOrSelect", args: [commands.cursorPageDown, commands.selectPageDown] },
    "PageUp|M-v": { command: "goOrSelect", args: [commands.cursorPageUp, commands.selectPageDown] },
    "C-Down": { command: "moveParagraph", args: 1 },
    "C-Up": { command: "moveParagraph", args: -1 },
    "S-C-Down": commands.selectPageDown,
    "S-C-Up": commands.selectPageUp,
    // The CodeMirror 5 dashboard editor does not load its search addon.
    "M-C-s": "findnext",
    "M-C-r": "findprevious",
    "S-M-5": "replace",
    // basic editing
    "Backspace": view => deleteBracketPair(view) || commands.deleteCharBackward(view),
    "Delete|C-d": commands.deleteCharForward,
    "Return|C-m": insertEmacsNewline,
    "C-j": view => !view.state.readOnly && commands.insertNewline(view),
    "Tab": commands.indentMore,
    "S-Tab": commands.indentLess,
    "C-o": commands.splitLine,
    "M-d|C-Delete": { command: "killWord", args: "right" },
    "C-Backspace|M-Backspace|M-Delete": { command: "killWord", args: "left" },
    "C-k": "killLine",
    "M-h": "selectParagraph",
    "M-@|M-S-2": "markWord",
    "C-y|S-Delete": "yank",
    "M-y": "yankRotate",
    "C-g": "keyboardQuit",
    "C-w|C-S-w": "killRegion",
    "M-w": "killRingSave",
    "C-Space": "setMark",
    "C-x C-x": "exchangePointAndMark",
    "C-t": commands.transposeChars,
    "M-u": { command: "changeCase", args: { dir: 1 } },
    "M-l": { command: "changeCase", args: { dir: -1 } },
    "M-c": "capitalizeWord",
    "M-Space": "justOneSpace",
    "C-x C-u": { command: "changeCase", args: { dir: 1, region: true } },
    "C-x C-l": { command: "changeCase", args: { dir: 1, region: true } },
    "M-/": startCompletion,
    "C-u": "universalArgument",
    "M-;": commands.toggleComment,
    "C-/|C-x u|S-C--|C-z": commands.undo,
    "S-C-/|S-C-x u|C--|S-C-z": commands.redo,
    // vertical editing
    "C-x r": "selectRectangularRegion",
    "M-x": { command: "focusCommandLine", args: "M-x " },
    // todo
    // "C-x C-t" "M-t" "M-c" "F11" "C-M- "M-q"
    "Esc": "unsetTransientMark"
};
for (let i in emacsKeys) {
    EmacsHandler.bindKey(i, emacsKeys[i]);
}
EmacsHandler.addCommands({
    unsetTransientMark: function (handler) {
        handler.setEmacsMark(null);
        return false;
    },
    markWord: function (handler, args) {
    },
    selectParagraph: function (handler, args) {
        var view = handler.view;
        var head = view.state.selection.ranges[0].head;
        var doc = view.state.doc;
        var startLine = doc.lineAt(head);
        var start = -1;
        var end = -1;
        var line = startLine;
        while (/\S/.test(line.text) && line.from > 0) {
            start = line.from;
            line = view.state.doc.lineAt(line.from - 1);
        }
        if (start == -1) {
            while (!/\S/.test(line.text) && line.to < doc.length) {
                start = line.from;
                line = view.state.doc.lineAt(line.to + 1);
            }
        }
        else {
            line = startLine;
        }
        while (/\S/.test(line.text) && line.to < doc.length) {
            end = line.to;
            line = view.state.doc.lineAt(line.to + 1);
        }
        if (end == -1) {
            end = startLine.to;
        }
        var newRanges = [EditorSelection.range(start, end)];
        view.dispatch({
            selection: EditorSelection.create(newRanges)
        });
    },
    goOrSelect: {
        exec: function (handler, args) {
            var command = handler.emacsMark() ? args[1] : args[0];
            command(handler.view);
        }
    },
    moveParagraph: function (handler, dir) {
        var view = handler.view;
        var doc = view.state.doc;
        var head = view.state.selection.main.head;
        var line = doc.lineAt(head);
        var sawText = /\S/.test(dir < 0 ? line.text.slice(0, head - line.from) : line.text.slice(head - line.from));
        for (;;) {
            var next = line.number + dir;
            if (next < 1 || next > doc.lines) {
                var end = dir < 0 ? line.from : line.to;
                view.dispatch({ selection: { anchor: handler.emacsMark() ? view.state.selection.main.anchor : end, head: end }, scrollIntoView: true });
                return;
            }
            line = doc.line(next);
            if (/\S/.test(line.text))
                sawText = true;
            else if (sawText) {
                view.dispatch({ selection: { anchor: handler.emacsMark() ? view.state.selection.main.anchor : line.from, head: line.from }, scrollIntoView: true });
                return;
            }
        }
    },
    capitalizeWord: function (handler) {
        var view = handler.view;
        if (view.state.readOnly)
            return;
        handler.clearSelection();
        commands.selectGroupForward(view);
        var specs = view.state.changeByRange((range) => {
            var word = view.state.sliceDoc(range.from, range.to);
            var letter = word.search(/\w/);
            var capitalized = letter < 0 ? word : word.slice(0, letter) + word.charAt(letter).toUpperCase() + word.slice(letter + 1).toLowerCase();
            return {
                changes: { from: range.from, to: range.to, insert: capitalized },
                range: EditorSelection.cursor(range.from + capitalized.length)
            };
        });
        view.dispatch(specs);
    },
    justOneSpace: function (handler) {
        var view = handler.view;
        if (view.state.readOnly)
            return;
        var head = view.state.selection.main.head;
        var line = view.state.doc.lineAt(head);
        var from = head;
        var to = head;
        while (from > line.from && /\s/.test(view.state.doc.sliceString(from - 1, from)))
            from--;
        while (to < line.to && /\s/.test(view.state.doc.sliceString(to, to + 1)))
            to++;
        view.dispatch({ changes: { from, to, insert: " " }, selection: { anchor: from + 1 } });
    },
    changeCase: function (handler, args) {
        var view = handler.view;
        if (!args.region) {
            handler.clearSelection();
            commands.selectGroupForward(view);
        }
        var specs = view.state.changeByRange((range) => {
            var toInsert = view.state.sliceDoc(range.from, range.to);
            toInsert = args.dir == 1 ? toInsert.toUpperCase() : toInsert.toLowerCase();
            return {
                changes: { from: range.from, to: range.to, insert: toInsert },
                range: EditorSelection.cursor(range.from + toInsert.length)
            };
        });
        view.dispatch(specs);
    },
    centerSelection: function (handler) {
        handler.view.dispatch({ scrollIntoView: true });
    },
    recenterTopBottom: function (handler) {
        var view = handler.view;
        var scrollTop = view.scrollDOM.scrollTop;
        view.dispatch({ scrollIntoView: true });
        try {
            // force synchronous measurment
            view.measure(true);
        }
        catch (e) { }
        if (scrollTop != view.scrollDOM.scrollTop)
            return;
        var base = view.scrollDOM.getBoundingClientRect();
        var cursor = view.coordsAtPos(view.state.selection.main.head);
        if (!cursor)
            return;
        var lineHeight = cursor.bottom - cursor.top;
        var screenHeight = base.height;
        var cursorTop = cursor.top - base.top;
        if (Math.abs(cursorTop) < lineHeight / 4) {
            scrollTop += cursorTop + lineHeight - screenHeight + 2;
        }
        else if (Math.abs(cursorTop - screenHeight * 0.5) < lineHeight / 4) {
            scrollTop += cursorTop - 2;
        }
        else {
            scrollTop += cursorTop - screenHeight * 0.5;
        }
        view.scrollDOM.scrollTop = scrollTop;
    },
    selectRectangularRegion: function (handler) {
        var view = handler.view;
        var ranges = view.state.selection.ranges;
        var newRanges = [];
        if (ranges.length > 1) {
            newRanges.push(EditorSelection.range(ranges[0].from, ranges[ranges.length - 1].to));
        }
        else {
            let doc = view.state.doc;
            let startLine = doc.lineAt(ranges[0].from);
            let endLine = doc.lineAt(ranges[0].to);
            let startCollumn = ranges[0].from - startLine.from;
            let endCollumn = ranges[0].to - endLine.from;
            while (startLine.from < endLine.to) {
                newRanges.push(EditorSelection.range(startLine.from + startCollumn, startLine.from + endCollumn));
                if (startLine.to + 1 >= doc.length)
                    break;
                startLine = doc.lineAt(startLine.to + 1);
            }
        }
        view.dispatch({
            selection: EditorSelection.create(newRanges)
        });
    },
    setMark: {
        exec: function (handler, args) {
            var view = handler.view;
            var ranges = view.state.selection.ranges;
            // Sets mark-mode and clears current selection.
            // When mark is set, keyboard cursor movement commands become
            // selection modification commands. That is,
            // "goto" commands become "select" commands.
            // Any insertion or mouse click resets mark-mode.
            // setMark twice in a row at the same place resets markmode.
            // in multi select mode, ea selection is handled individually
            if (args && args.count) {
                var newMark = handler.selectionToEmacsMark();
                var mark = handler.popEmacsMark();
                if (mark) {
                    var newRanges = mark.map((p) => {
                        return EditorSelection.cursor(p, p);
                    });
                    view.dispatch({
                        selection: EditorSelection.create(newRanges)
                    });
                    handler.$emacsMarkRing.unshift(newMark);
                }
                return;
            }
            var mark = handler.emacsMark();
            var rangePositions = ranges.map(function (r) { return r.head; });
            var hasNoSelection = ranges.every(function (range) { return range.from == range.to; });
            // if transientMarkModeActive then mark behavior is a little
            // different. Deactivate the mark when setMark is run with active
            // mark
            if ((mark || !hasNoSelection)) {
                handler.clearSelection();
                if (mark)
                    handler.pushEmacsMark(null);
                return;
            }
            if (!mark) {
                handler.pushEmacsMark(rangePositions);
                handler.setEmacsMark(rangePositions);
                return;
            }
            // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        },
        readOnly: true,
        handlesCount: true
    },
    exchangePointAndMark: {
        exec: function (handler, args) {
            var view = handler.view;
            var selection = view.state.selection;
            var isEmpty = !selection.ranges.some(r => r.from != r.to);
            if (!args.count && !isEmpty) { // just invert selection
                var newRanges = selection.ranges.map(x => {
                    return EditorSelection.range(x.head, x.anchor);
                });
                view.dispatch({
                    selection: EditorSelection.create(newRanges, selection.mainIndex)
                });
                return;
            }
            var markRing = handler.$emacsMarkRing;
            var lastMark = markRing[markRing.length - 1];
            if (!lastMark)
                return;
            if (args.count) { // replace mark and point
                markRing[markRing.length - 1] = handler.selectionToEmacsMark();
                handler.clearSelection();
                var newRanges = lastMark.map(x => {
                    return EditorSelection.range(x, x);
                });
                view.dispatch({
                    selection: EditorSelection.create(newRanges, selection.mainIndex)
                });
            }
            else { // create selection to last mark
                var n = Math.min(lastMark.length, selection.ranges.length);
                newRanges = [];
                for (var i = 0; i < n; i++) {
                    newRanges.push(EditorSelection.range(selection.ranges[i].head, lastMark[i]));
                }
            }
        },
        readOnly: true,
        handlesCount: true,
    },
    killWord: {
        exec: function (handler, dir) {
            var view = handler.view;
            var selection = view.state.selection;
            var newRanges = selection.ranges.map(x => {
                return EditorSelection.range(x.head, x.head);
            });
            view.dispatch({
                selection: EditorSelection.create(newRanges, selection.mainIndex)
            });
            if (dir == "left")
                commands.selectGroupBackward(view);
            else
                commands.selectGroupForward(view);
            selection = view.state.selection;
            selection.ranges.forEach(r => {
                var text = view.state.sliceDoc(r.from, r.to);
                killRing.add(text);
            });
            view.dispatch(view.state.replaceSelection(""));
        },
    },
    killLine: {
        exec: function (handler) {
            handler.pushEmacsMark(null);
            // don't delete the selection if it's before the cursor
            handler.clearSelection();
            var view = handler.view;
            var state = view.state;
            var text = [];
            var changes = state.selection.ranges.map(function (range) {
                var from = range.head;
                var lineObject = state.doc.lineAt(from);
                var to = lineObject.to;
                var line = state.sliceDoc(from, to);
                // remove EOL if only whitespace remains after the cursor
                if (/^\s*$/.test(line) && to < state.doc.length - 1) {
                    to += 1;
                    text.push(line + "\n");
                }
                else {
                    text.push(line);
                }
                return { from, to, insert: "" };
            });
            if (handler.$data.lastCommand == "killLine") {
                killRing.append(text.join("\n"));
            }
            else {
                killRing.add(text.join("\n"));
            }
            handler.$data.lastCommand = "killLine";
            view.dispatch({ changes });
        },
        keepLastCommand: true
    },
    yank: {
        exec: function (handler) {
            handler.onPaste(killRing.get());
            handler.$data.lastCommand = "yank";
        },
        keepLastCommand: true
    },
    yankRotate: {
        exec: function (handler) {
            if (handler.$data.lastCommand != "yank")
                return;
            commands.undo(handler.view);
            handler.$emacsMarkRing.pop(); // also undo recording mark
            handler.onPaste(killRing.rotate());
            handler.$data.lastCommand = "yank";
        },
        keepLastCommand: true
    },
    killRegion: {
        exec: function (handler) {
            killRing.add(handler.getCopyText());
            var view = handler.view;
            view.dispatch(view.state.replaceSelection(""));
            handler.setEmacsMark(null);
        },
    },
    killRingSave: {
        exec: function (handler) {
            var text = handler.getCopyText();
            killRing.add(text);
            handler.clearSelection();
            handler.setEmacsMark(null);
            navigator.clipboard.writeText(text);
        },
        readOnly: true
    },
    keyboardQuit: function (handler) {
        var view = handler.view;
        var selection = view.state.selection;
        var isEmpty = !selection.ranges.some(r => r.from != r.to);
        if (selection.ranges.length > 1 && !isEmpty) {
            var newRanges = selection.ranges.map(x => {
                return EditorSelection.range(x.head, x.head);
            });
            view.dispatch({
                selection: EditorSelection.create(newRanges, selection.mainIndex)
            });
        }
        else {
            commands.simplifySelection(handler.view);
        }
        handler.setEmacsMark(null);
        handler.$data.count = null;
    },
    focusCommandLine: function (handler, arg) {
        handler.showCommandLine(arg);
    }
});
const killRing = {
    $data: [],
    add: function (str) {
        str && this.$data.push(str);
        if (this.$data.length > 30)
            this.$data.shift();
    },
    append: function (str) {
        var idx = this.$data.length - 1;
        var text = this.$data[idx] || "";
        if (str)
            text += str;
        if (text)
            this.$data[idx] = text;
    },
    get: function (n) {
        n = n || 1;
        return this.$data.slice(this.$data.length - n, this.$data.length).reverse().join('\n');
    },
    pop: function () {
        if (this.$data.length > 1)
            this.$data.pop();
        return this.get();
    },
    rotate: function () {
        let last = this.$data.pop();
        if (last)
            this.$data.unshift(last);
        return this.get();
    }
};

export { EmacsHandler, emacs, emacsKeys };
