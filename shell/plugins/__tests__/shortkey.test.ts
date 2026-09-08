import ShortKey, { _internal } from '@shell/plugins/shortkey';

const {
  handleHoldKeydown, handleHoldKeyup, releaseHeldKeys, availableElement
} = _internal;

// shortkey.js is untyped, so `_internal.mapFunctions` widens to `{}` and can't be string-indexed. Describe
// the one binding shape these tests register (field names, incl. the source's `propagte` spelling, kept
// verbatim) so the registry reads/writes are typed rather than implicit `any`.
type ShortkeyBinding = {
  hold?: boolean; held?: boolean; once?: boolean; push?: boolean; focus?: boolean;
  key?: string; propagte?: boolean; anywhere?: boolean; el?: HTMLElement[];
};
const mapFunctions = _internal.mapFunctions as Record<string, ShortkeyBinding>;

// The `.hold` modifier (issue 11329): a held binding reports ABSOLUTE state via the `shortkey` event's
// `detail.held` (true on keydown, false on keyup / focus loss) and never preventDefaults, so it can't
// desync or invert the way the old `.push` toggle did. The document listeners are disabled under
// NODE_ENV=test, so these drive the extracted handlers directly against the shared registry.
describe('shortkey .hold modifier', () => {
  let el: HTMLElement;
  let held: Array<boolean>;

  const registerHold = (key = 'alt') => {
    el = document.createElement('button');
    held = [];
    el.addEventListener('shortkey', (e) => held.push((e as CustomEvent).detail.held));
    mapFunctions[key] = {
      hold: true, held: false, key: 'windows', propagte: false, el: [el]
    };
  };

  beforeEach(() => {
    // Isolate each test from the shared module-level registry.
    Object.keys(mapFunctions).forEach((k) => delete mapFunctions[k]);
  });

  it('dispatches held:true on keydown and held:false on keyup — absolute, never toggling', () => {
    registerHold();

    expect(handleHoldKeydown('alt')).toBe(true);
    expect(held).toStrictEqual([true]);

    // Auto-repeat / a re-press after a missed keyup stays held: no duplicate event, no flip off.
    handleHoldKeydown('alt');
    expect(held).toStrictEqual([true]);

    expect(handleHoldKeyup('alt')).toBe(true);
    expect(held).toStrictEqual([true, false]);

    // A stray keyup with no matching keydown must not invert it back on (the old toggle bug).
    handleHoldKeyup('alt');
    expect(held).toStrictEqual([true, false]);
  });

  it('releases held bindings on focus loss (blur / tab hide)', () => {
    registerHold();

    handleHoldKeydown('alt');
    expect(held).toStrictEqual([true]);

    releaseHeldKeys();
    expect(held).toStrictEqual([true, false]);

    // Nothing held any more — releasing again is a no-op.
    releaseHeldKeys();
    expect(held).toStrictEqual([true, false]);
  });

  it('ignores non-hold bindings and unknown keys', () => {
    el = document.createElement('button');
    held = [];
    el.addEventListener('shortkey', (e) => held.push((e as CustomEvent).detail?.held));
    mapFunctions['x'] = {
      hold: false, once: true, key: '', propagte: false, el: [el]
    };

    expect(handleHoldKeydown('x')).toBe(false);
    expect(handleHoldKeyup('x')).toBe(false);
    expect(handleHoldKeydown('unknown')).toBe(false);
    expect(handleHoldKeyup('unknown')).toBe(false);
    expect(held).toStrictEqual([]);
  });
});

// The `.anywhere` modifier: a binding that has to keep working while the caret is in a text field —
// Cmd/Ctrl+J closes the flyout, whose own search box holds focus whenever it is open, so the avoid list
// would otherwise make the shortcut a one-way trip.
describe('shortkey .anywhere modifier', () => {
  const registry = _internal.mapFunctions as Record<string, ShortkeyBinding>;

  beforeAll(() => {
    // The avoid lists come from install options; the directive registration is not exercised here.
    ShortKey.install({ directive: () => {} } as any, { prevent: ['input'], preventContainer: ['#modal-container-element'] });
  });

  beforeEach(() => {
    Object.keys(registry).forEach((k) => delete registry[k]);
    registry.metaj = { key: 'mac', el: [document.createElement('button')] };
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  const focusAn = (tag: string, inModal = false) => {
    document.body.innerHTML = inModal ? `<div id="modal-container-element"><${ tag } id="f" /></div>` : `<${ tag } id="f" />`;
    (document.getElementById('f') as HTMLElement).focus();
  };

  it('holds an ordinary binding back while focus is in a text field', () => {
    focusAn('input');

    expect(availableElement('metaj')).toBe(false);
  });

  it('lets an `anywhere` binding through from that same field', () => {
    registry.metaj.anywhere = true;
    focusAn('input');

    expect(availableElement('metaj')).toBe(true);
  });

  // `anywhere` opts out of the element list only: a modal still owns the screen.
  it('is still held back inside a modal', () => {
    registry.metaj.anywhere = true;
    focusAn('input', true);

    expect(availableElement('metaj')).toBe(false);
  });

  // The modal rule is about the modal being ON THE PAGE, not about it holding focus. Most dialogs do not
  // trap focus, and clicking a dialog's own text drops focus to <body> — from where every shortcut used
  // to fire and draw its panel behind the modal.
  it.each([
    ['a plain binding', false],
    ['an `anywhere` binding', true],
  ])('holds %s back while a modal is on the page, wherever focus sits', (_label, anywhere) => {
    registry.metaj.anywhere = anywhere;
    document.body.innerHTML = '<div id="modal-container-element"></div><button id="behind">x</button>';
    (document.getElementById('behind') as HTMLElement).focus();

    expect(document.activeElement?.closest('#modal-container-element')).toBeNull();
    expect(availableElement('metaj')).toBe(false);
  });

  // The flyout is registered alongside the modal container: it is a panel over a full-page scrim with its
  // own keyboard, so the app's shortcuts stand down for it the same way.
  it('treats the cluster-switcher flyout as one of those containers', () => {
    ShortKey.install({ directive: () => {} } as any, { prevent: ['input'], preventContainer: ['.cluster-switcher-popper'] });
    document.body.innerHTML = '<div class="cluster-switcher-popper"></div>';

    expect(availableElement('metaj')).toBe(false);
  });

  it('is false for a key nothing is bound to', () => {
    expect(availableElement('metaz')).toBe(false);
  });
});
