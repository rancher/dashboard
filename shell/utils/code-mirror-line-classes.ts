/**
 * A CodeMirror 6 extension that puts a class on whole lines, on both the code area
 * and the gutters, e.g. to tint the lines that differ from the chart defaults (see
 * YamlOverridesEditor.vue). The classes follow their lines while the document is
 * edited, until the next `setLineClasses` replaces them.
 */
import { RangeSet, StateEffect, StateField } from '@codemirror/state';
import type { Range, Text } from '@codemirror/state';
import { Decoration, EditorView, GutterMarker, gutterLineClass } from '@codemirror/view';
import type { DecorationSet } from '@codemirror/view';

/** A 0-based line number and the class to put on it. */
export interface LineClass {
  line: number;
  className: string;
}

/** Puts `elementClass` on the gutter elements of a line. */
class LineClassMarker extends GutterMarker {
  constructor(readonly elementClass: string) {
    super();
  }

  eq(other: GutterMarker): boolean {
    return other instanceof LineClassMarker && other.elementClass === this.elementClass;
  }
}

interface LineClassState {
  lines: DecorationSet;
  gutters: RangeSet<GutterMarker>;
}

const setLineClassesEffect = StateEffect.define<LineClass[]>();

function buildLineClasses(doc: Text, lineClasses: LineClass[]): LineClassState {
  const lines: Range<Decoration>[] = [];
  const gutters: Range<GutterMarker>[] = [];

  lineClasses.filter((l) => l.line >= 0 && l.line < doc.lines).forEach(({ line, className }) => {
    const from = doc.line(line + 1).from;

    lines.push(Decoration.line({ class: className }).range(from));
    gutters.push(new LineClassMarker(className).range(from));
  });

  return { lines: Decoration.set(lines, true), gutters: RangeSet.of(gutters, true) };
}

const lineClassField = StateField.define<LineClassState>({
  create: () => ({ lines: Decoration.none, gutters: RangeSet.empty }),

  update(value, tr) {
    let next = tr.docChanged ? { lines: value.lines.map(tr.changes), gutters: value.gutters.map(tr.changes) } : value;

    tr.effects.forEach((e) => {
      if (e.is(setLineClassesEffect)) {
        next = buildLineClasses(tr.state.doc, e.value);
      }
    });

    return next;
  },

  provide: (field) => [
    EditorView.decorations.from(field, (value) => value.lines),
    gutterLineClass.from(field, (value) => value.gutters),
  ],
});

/**
 * Replace the line classes of the editor, so callers pass the full set each time.
 * The extension is only added to an editor the first time it's used.
 */
export function setLineClasses(view: EditorView, lineClasses: LineClass[] = []) {
  if (!view.state.field(lineClassField, false)) {
    view.dispatch({ effects: StateEffect.appendConfig.of(lineClassField) });
  }

  view.dispatch({ effects: setLineClassesEffect.of(lineClasses) });
}
