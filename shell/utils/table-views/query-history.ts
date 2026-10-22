/**
 * The search box's own undo history. The box rebuilds its contents as it highlights them, which the
 * browser's undo can't follow, so it keeps this instead: one entry per word typed or run of deletions,
 * and one per paste, cut, suggestion or clear
 */
export interface QueryHistoryEntry {
  text: string;
  caret: number;
}

/** Typed letters and deletions join the entry being typed; anything else is an entry of its own */
export type QueryChange = 'insert' | 'delete' | 'other';

/** Typing after a pause this long starts a new entry, as a space does */
export const TYPING_GROUP_MS = 1000;

const LIMIT = 100;

const TYPED: Record<string, QueryChange> = {
  insertText:            'insert',
  insertCompositionText: 'insert',
  deleteContentBackward: 'delete',
  deleteContentForward:  'delete',
  deleteWordBackward:    'delete',
  deleteWordForward:     'delete',
};

/** An input event's `inputType` as a change: a cut, a drop or a spelling fix is one of its own */
export function changeOf(inputType?: string): QueryChange {
  return (inputType && TYPED[inputType]) || 'other';
}

/** Where `from` and `to` differ: what of `from` is replaced, by how much of `to` */
function difference(from: string, to: string) {
  let start = 0;

  while (start < from.length && start < to.length && from[start] === to[start]) {
    start++;
  }

  let end = 0;

  while (end < from.length - start && end < to.length - start && from[from.length - 1 - end] === to[to.length - 1 - end]) {
    end++;
  }

  return {
    start, removed: from.length - start - end, inserted: to.slice(start, to.length - end)
  };
}

/** Moving from `from` to `to`, the caret lands after what `to` has there instead */
function caretFor(from: string, to: string) {
  const { start, inserted } = difference(from, to);

  return start + inserted.length;
}

export interface QueryHistory {
  record(text: string, change: QueryChange, now?: number): void;
  /** The caret goes to the end of the text a step puts back, or puts in, as a native input's does */
  undo(): QueryHistoryEntry | null;
  redo(): QueryHistoryEntry | null;
  /** Starts again from text put in from outside, eg another tab's query */
  reset(text: string): void;
  current(): string;
}

export function createQueryHistory(initial = ''): QueryHistory {
  let entries = [initial];
  let index = 0;
  let typingAt = 0;
  let typing: QueryChange = 'other';

  const current = () => entries[index];

  return {
    record(text, change, now = Date.now()) {
      if (text === current()) {
        return;
      }

      const { removed, inserted } = difference(current(), text);
      // Letters typed, or a run of deletions, go on the same entry; a space typed, typing over a
      // selection, a change from one to the other or a pause starts the next
      const joins = change !== 'other' && change === typing && !!typingAt && now - typingAt < TYPING_GROUP_MS && index > 0 &&
        !(removed && inserted) && !/\s/.test(inserted);

      // Anything undone is dropped once something new is done
      entries = entries.slice(0, index + 1);

      if (joins) {
        entries[index] = text;
      } else {
        entries.push(text);
        if (entries.length > LIMIT) {
          entries.shift();
        }
        index = entries.length - 1;
      }

      typingAt = change === 'other' ? 0 : now;
      typing = change;
    },

    undo() {
      typingAt = 0;

      if (index === 0) {
        return null;
      }

      const caret = caretFor(current(), entries[index - 1]);

      index -= 1;

      return { text: current(), caret };
    },

    redo() {
      typingAt = 0;

      if (index === entries.length - 1) {
        return null;
      }

      const caret = caretFor(current(), entries[index + 1]);

      index += 1;

      return { text: current(), caret };
    },

    reset(text) {
      entries = [text];
      index = 0;
      typingAt = 0;
    },

    current,
  };
}
