type Entry = { target: Element };
type RevealModule = typeof import('./reveal');

/** Records the observer reveal.ts creates, so tests can fire it as the browser would after a layout change */
class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];

  callback: (entries: Entry[]) => void;
  observed = new Set<Element>();

  constructor(callback: (entries: Entry[]) => void) {
    this.callback = callback;
    FakeResizeObserver.instances.push(this);
  }

  observe(el: Element) {
    this.observed.add(el);
  }

  unobserve(el: Element) {
    this.observed.delete(el);
  }

  fire(el: Element) {
    this.callback([{ target: el }]);
  }
}

const sized = (width: number, height: number) => {
  const el = document.createElement('div');

  el.getBoundingClientRect = () => ({ width, height } as DOMRect);

  return el;
};

const resize = (el: HTMLElement, width: number, height: number) => {
  el.getBoundingClientRect = () => ({ width, height } as DOMRect);
};

describe('utils: reveal', () => {
  let observeReveal: RevealModule['observeReveal'];
  const originalResizeObserver = globalThis.ResizeObserver;

  const observer = () => FakeResizeObserver.instances[0];

  beforeEach(() => {
    FakeResizeObserver.instances = [];
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = FakeResizeObserver;

    // reveal.ts keeps one observer for the module, so each test needs a fresh copy
    jest.isolateModules(() => {
      ({ observeReveal } = require('./reveal'));
    });
  });

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver;
  });

  it('should call onReveal when a hidden element is shown', () => {
    const el = sized(0, 0);
    const onReveal = jest.fn();

    observeReveal(el, onReveal);
    resize(el, 300, 40);
    observer().fire(el);

    expect(onReveal).toHaveBeenCalledTimes(1);
  });

  it('should not call onReveal when an element that is already shown is observed', () => {
    const el = sized(300, 40);
    const onReveal = jest.fn();

    observeReveal(el, onReveal);
    observer().fire(el);

    expect(onReveal).not.toHaveBeenCalledWith();
  });

  it('should not call onReveal when a shown element only changes size', () => {
    const el = sized(300, 40);
    const onReveal = jest.fn();

    observeReveal(el, onReveal);
    resize(el, 500, 80);
    observer().fire(el);

    expect(onReveal).not.toHaveBeenCalledWith();
  });

  it('should not call onReveal while the element stays hidden', () => {
    const el = sized(0, 0);
    const onReveal = jest.fn();

    observeReveal(el, onReveal);
    observer().fire(el);

    expect(onReveal).not.toHaveBeenCalledWith();
  });

  it('should call onReveal again each time the element is hidden and shown', () => {
    const el = sized(0, 0);
    const onReveal = jest.fn();

    observeReveal(el, onReveal);
    resize(el, 300, 40);
    observer().fire(el);
    resize(el, 0, 0);
    observer().fire(el);
    resize(el, 300, 40);
    observer().fire(el);

    expect(onReveal).toHaveBeenCalledTimes(2);
  });

  it('should treat an element with only a width as shown', () => {
    const el = sized(0, 0);
    const onReveal = jest.fn();

    observeReveal(el, onReveal);
    resize(el, 300, 0);
    observer().fire(el);

    expect(onReveal).toHaveBeenCalledTimes(1);
  });

  it('should only call onReveal for the element that was shown', () => {
    const shown = sized(0, 0);
    const stillHidden = sized(0, 0);
    const onShown = jest.fn();
    const onStillHidden = jest.fn();

    observeReveal(shown, onShown);
    observeReveal(stillHidden, onStillHidden);
    resize(shown, 300, 40);
    observer().fire(shown);
    observer().fire(stillHidden);

    expect({ shown: onShown.mock.calls.length, stillHidden: onStillHidden.mock.calls.length }).toStrictEqual({ shown: 1, stillHidden: 0 });
  });

  it('should share one observer between elements', () => {
    observeReveal(sized(0, 0), jest.fn());
    observeReveal(sized(0, 0), jest.fn());

    expect(FakeResizeObserver.instances).toHaveLength(1);
  });

  it('should stop observing the element when the returned function is called', () => {
    const el = sized(0, 0);

    const stop = observeReveal(el, jest.fn());

    stop();

    expect(observer().observed.has(el)).toBe(false);
  });

  it('should not call onReveal after the returned function is called', () => {
    const el = sized(0, 0);
    const onReveal = jest.fn();

    const stop = observeReveal(el, onReveal);

    stop();
    resize(el, 300, 40);
    observer().fire(el);

    expect(onReveal).not.toHaveBeenCalledWith();
  });

  it('should do nothing when ResizeObserver is not available', () => {
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = undefined;

    const stop = observeReveal(sized(0, 0), jest.fn());

    expect({ observers: FakeResizeObserver.instances.length, stop: stop() }).toStrictEqual({ observers: 0, stop: undefined });
  });
});
