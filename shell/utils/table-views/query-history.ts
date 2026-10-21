/**
 * The search box's own undo history. The box rebuilds its contents as it highlights them, which the
 * browser's undo can't follow, so it keeps this instead: one entry per word typed, and one per paste,
 * suggestion or clear
 */
export interface QueryHistoryEntry {
  text: string;
  caret: number;
}

/** Typing after a pause this long starts a new entry, as a space does */
export const TYPING_GROUP_MS = 1000;

const LIMIT = 100;

export interface QueryHistory {
  /** `typing` joins the entry being typed; anything else is an entry of its own */
  record(text: string, caret: number, typing: boolean, now?: number): void;
  undo(): QueryHistoryEntry | null;
  redo(): QueryHistoryEntry | null;
  /** Starts again from text put in from outside, eg another tab's query */
  reset(text: string): void;
  current(): QueryHistoryEntry;
}

export function createQueryHistory(initial = ''): QueryHistory {
  let entries: QueryHistoryEntry[] = [{ text: initial, caret: initial.length }];
  let index = 0;
  let typingAt = 0;
  // Which way the entry being typed goes: growing as letters are typed, shrinking as they are deleted
  let typingGrows = true;

  const current = () => entries[index];

  return {
    record(text, caret, typing, now = Date.now()) {
      if (text === current().text) {
        return;
      }

      const grows = text.length > current().text.length;
      // A word typed, or a run of deletions, goes on the same entry; a space typed, a change of
      // direction or a pause starts the next
      const joins = typing && !!typingAt && now - typingAt < TYPING_GROUP_MS && index > 0 && grows === typingGrows &&
        !(grows && /\s/.test(text.charAt(caret - 1)));

      // Anything undone is dropped once something new is done
      entries = entries.slice(0, index + 1);

      if (joins) {
        entries[index] = { text, caret };
      } else {
        entries.push({ text, caret });
        if (entries.length > LIMIT) {
          entries.shift();
        }
        index = entries.length - 1;
      }

      typingAt = typing ? now : 0;
      typingGrows = grows;
    },

    undo() {
      typingAt = 0;

      if (index === 0) {
        return null;
      }

      index -= 1;

      return current();
    },

    redo() {
      typingAt = 0;

      if (index === entries.length - 1) {
        return null;
      }

      index += 1;

      return current();
    },

    reset(text) {
      entries = [{ text, caret: text.length }];
      index = 0;
      typingAt = 0;
    },

    current,
  };
}
