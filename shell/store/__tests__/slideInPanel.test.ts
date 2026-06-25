import slideInPanelStore from '../slideInPanel';

describe('slideInPanel store', () => {
  let s: ReturnType<typeof slideInPanelStore.state>;
  const fakeComponent = { name: 'FakePanel' } as any;

  beforeEach(() => {
    s = slideInPanelStore.state();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('state', () => {
    it('returns initial default state', () => {
      expect(s.isOpen).toBe(false);
      expect(s.isClosing).toBe(false);
      expect(s.component).toBeNull();
      expect(s.componentProps).toStrictEqual({});
    });
  });

  describe('mutations', () => {
    describe('open', () => {
      it('sets isOpen to true', () => {
        slideInPanelStore.mutations.open(s, { component: fakeComponent });

        expect(s.isOpen).toBe(true);
      });

      it('stores the component reference', () => {
        slideInPanelStore.mutations.open(s, { component: fakeComponent });

        expect(s.component).toBe(fakeComponent);
      });

      it('sets componentProps from payload', () => {
        slideInPanelStore.mutations.open(s, { component: fakeComponent, componentProps: { title: 'Test' } });

        expect(s.componentProps).toStrictEqual({ title: 'Test' });
      });

      it('defaults componentProps to empty object when not provided', () => {
        slideInPanelStore.mutations.open(s, { component: fakeComponent });

        expect(s.componentProps).toStrictEqual({});
      });
    });

    describe('close', () => {
      beforeEach(() => {
        slideInPanelStore.mutations.open(s, { component: fakeComponent, componentProps: { title: 'Test' } });
      });

      it('sets isClosing to true immediately', () => {
        slideInPanelStore.mutations.close(s);

        expect(s.isClosing).toBe(true);
      });

      it('sets isOpen to false immediately', () => {
        slideInPanelStore.mutations.close(s);

        expect(s.isOpen).toBe(false);
      });

      it('retains component and componentProps before the 500ms delay elapses', () => {
        slideInPanelStore.mutations.close(s);
        jest.advanceTimersByTime(499);

        expect(s.component).toBe(fakeComponent);
        expect(s.componentProps).toStrictEqual({ title: 'Test' });
        expect(s.isClosing).toBe(true);
      });

      it('clears component, componentProps and isClosing after 500ms', () => {
        slideInPanelStore.mutations.close(s);
        jest.advanceTimersByTime(500);

        expect(s.component).toBeNull();
        expect(s.componentProps).toStrictEqual({});
        expect(s.isClosing).toBe(false);
      });
    });
  });
});
