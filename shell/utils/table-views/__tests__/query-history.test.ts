import { createQueryHistory, TYPING_GROUP_MS } from '@shell/utils/table-views/query-history';

/** Types `text` a letter at a time, from where the history is, a few milliseconds apart */
const typeInto = (history: ReturnType<typeof createQueryHistory>, text: string, start = 0) => {
  let now = start;

  for (let i = history.current().text.length + 1; i <= text.length; i++) {
    now += 50;
    history.record(text.substring(0, i), i, true, now);
  }

  return now;
};

describe('createQueryHistory', () => {
  it('should undo a word at a time, then nothing', () => {
    const history = createQueryHistory();

    typeInto(history, 'state:active name:web');

    expect(history.undo()?.text).toBe('state:active');
    expect(history.undo()?.text).toBe('');
    expect(history.undo()).toBeNull();
  });

  it('should redo what was undone, then nothing', () => {
    const history = createQueryHistory();

    typeInto(history, 'state:active name:web');
    history.undo();
    history.undo();

    expect(history.redo()?.text).toBe('state:active');
    expect(history.redo()?.text).toBe('state:active name:web');
    expect(history.redo()).toBeNull();
  });

  it('should start a new step after a pause in typing', () => {
    const history = createQueryHistory();
    const at = typeInto(history, 'state');

    history.record('state:', 6, true, at + TYPING_GROUP_MS + 1);

    expect(history.undo()?.text).toBe('state');
  });

  it('should take a run of deletions back as one step', () => {
    const history = createQueryHistory();
    let now = typeInto(history, 'state:active');

    for (const text of ['state:activ', 'state:acti', 'state:act']) {
      now += 50;
      history.record(text, text.length, true, now);
    }

    expect(history.undo()?.text).toBe('state:active');
  });

  it('should keep a paste, a suggestion or a clear as a step of its own', () => {
    const history = createQueryHistory();
    const at = typeInto(history, 'state:');

    history.record('state:active', 12, false, at + 10);
    history.record('', 0, false, at + 20);

    expect(history.undo()?.text).toBe('state:active');
    expect(history.undo()?.text).toBe('state:');
  });

  it('should drop what was undone once something new is done', () => {
    const history = createQueryHistory();

    typeInto(history, 'state:active name:web');
    history.undo();
    history.record('state:active ns:x', 17, false);

    expect(history.redo()).toBeNull();
    expect(history.undo()?.text).toBe('state:active');
  });

  it('should give the caret with each step', () => {
    const history = createQueryHistory();

    typeInto(history, 'state:active name:web');

    expect(history.undo()).toStrictEqual({ text: 'state:active', caret: 12 });
  });

  it('should start again from a query put in from outside', () => {
    const history = createQueryHistory();

    typeInto(history, 'state:active');
    history.reset('name:other');

    expect(history.current().text).toBe('name:other');
    expect(history.undo()).toBeNull();
  });
});
