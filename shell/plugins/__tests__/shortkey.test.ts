import { _internal } from '@shell/plugins/shortkey';

const { handleHoldKeydown, handleHoldKeyup, releaseHeldKeys } = _internal;

// shortkey.js is untyped, so `_internal.mapFunctions` widens to `{}` and can't be string-indexed. Describe
// the one binding shape these tests register (field names, incl. the source's `propagte` spelling, kept
// verbatim) so the registry reads/writes are typed rather than implicit `any`.
type ShortkeyBinding = {
  hold?: boolean; held?: boolean; once?: boolean; push?: boolean; focus?: boolean;
  key?: string; propagte?: boolean; el?: HTMLElement[];
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
