import { changeOf, createQueryHistory, TYPING_GROUP_MS } from '@shell/utils/table-views/query-history';

/** Types `text` a letter at a time onto the end of what the history holds, a few milliseconds apart */
const typeInto = (history: ReturnType<typeof createQueryHistory>, text: string, start = 0) => {
  let now = start;

  for (let i = history.current().length + 1; i <= text.length; i++) {
    now += 50;
    history.record(text.substring(0, i), 'insert', now);
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

    history.record('state:', 'insert', at + TYPING_GROUP_MS + 1);

    expect(history.undo()?.text).toBe('state');
  });

  it('should take a run of deletions back as one step', () => {
    const history = createQueryHistory();
    let now = typeInto(history, 'state:active');

    for (const text of ['state:activ', 'state:acti', 'state:act']) {
      now += 50;
      history.record(text, 'delete', now);
    }

    expect(history.undo()?.text).toBe('state:active');
  });

  it('should take a word typed over a selection back in one step, to what was selected', () => {
    const history = createQueryHistory('state:active name:web');
    let now = 0;

    for (const text of ['state:r name:web', 'state:ru name:web', 'state:run name:web']) {
      now += 50;
      history.record(text, 'insert', now);
    }

    expect(history.undo()?.text).toBe('state:active name:web');
    expect(history.undo()).toBeNull();
  });

  it('should not join typing over a selection to the word typed before it', () => {
    const history = createQueryHistory();
    const at = typeInto(history, 'state:active');

    history.record('state:r', 'insert', at + 50);

    expect(history.undo()?.text).toBe('state:active');
  });

  it('should keep a paste, a cut, a suggestion or a clear as a step of its own', () => {
    const history = createQueryHistory();
    const at = typeInto(history, 'state:');

    history.record('state:active', 'other', at + 10);
    history.record('', 'other', at + 20);

    expect(history.undo()?.text).toBe('state:active');
    expect(history.undo()?.text).toBe('state:');
  });

  it('should drop what was undone once something new is done', () => {
    const history = createQueryHistory();

    typeInto(history, 'state:active name:web');
    history.undo();
    history.record('state:active ns:x', 'other');

    expect(history.redo()).toBeNull();
    expect(history.undo()?.text).toBe('state:active');
  });

  it('should put the caret back where a typed letter was taken out, and after it again on redo', () => {
    const history = createQueryHistory('kube root');

    history.record('xkube root', 'insert', 50);

    expect(history.undo()).toStrictEqual({ text: 'kube root', caret: 0 });
    expect(history.redo()).toStrictEqual({ text: 'xkube root', caret: 1 });
  });

  it('should put the caret after deleted letters it brings back', () => {
    const history = createQueryHistory('state:active name:web');

    history.record('state: name:web', 'delete', 50);

    expect(history.undo()).toStrictEqual({ text: 'state:active name:web', caret: 12 });
  });

  it('should start again from a query put in from outside', () => {
    const history = createQueryHistory();

    typeInto(history, 'state:active');
    history.reset('name:other');

    expect(history.current()).toBe('name:other');
    expect(history.undo()).toBeNull();
  });
});

describe('changeOf', () => {
  it.each([
    ['insertText', 'insert'],
    ['insertCompositionText', 'insert'],
    ['deleteContentBackward', 'delete'],
    ['deleteWordBackward', 'delete'],
    ['deleteByCut', 'other'],
    ['insertFromDrop', 'other'],
    ['insertReplacementText', 'other'],
    [undefined, 'other'],
  ])('should take %s as %s', (inputType, change) => {
    expect(changeOf(inputType)).toBe(change);
  });
});
