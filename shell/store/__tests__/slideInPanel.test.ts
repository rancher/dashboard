import slideInPanel, { SlideInPanelState } from '@shell/store/slideInPanel';

const MockComponentA = { template: '<div>A</div>' };
const MockComponentB = { template: '<div>B</div>' };

const { state: stateFactory, mutations, getters } = slideInPanel;

function createState(overrides: Partial<SlideInPanelState> = {}): SlideInPanelState {
  return {
    ...stateFactory(),
    ...overrides
  };
}

describe('slideInPanel store', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('state', () => {
    it('returns correct initial state', () => {
      const result = stateFactory();

      expect(result).toStrictEqual({
        isOpen:         false,
        isClosing:      false,
        component:      null,
        componentProps: {}
      });
    });
  });

  describe('getters', () => {
    it('returns isOpen from state', () => {
      const state = createState({ isOpen: true });

      expect(getters.isOpen(state, {}, {}, {})).toStrictEqual(true);
    });

    it('returns isClosing from state', () => {
      const state = createState({ isClosing: true });

      expect(getters.isClosing(state, {}, {}, {})).toStrictEqual(true);
    });

    it('returns component from state', () => {
      const state = createState({ component: MockComponentA as any });

      expect(getters.component(state, {}, {}, {})).toStrictEqual(MockComponentA);
    });

    it('returns componentProps from state', () => {
      const props = { title: 'Test' };
      const state = createState({ componentProps: props });

      expect(getters.componentProps(state, {}, {}, {})).toStrictEqual(props);
    });
  });

  describe('mutations', () => {
    describe('open', () => {
      it('sets isOpen to true and stores component and props', () => {
        const state = createState();
        const props = { title: 'Test Panel' };

        mutations.open(state, { component: MockComponentA, componentProps: props });

        expect(state.isOpen).toStrictEqual(true);
        expect(state.component).toStrictEqual(MockComponentA);
        expect(state.componentProps).toStrictEqual(props);
      });

      it('defaults componentProps to empty object when not provided', () => {
        const state = createState();

        mutations.open(state, { component: MockComponentA });

        expect(state.componentProps).toStrictEqual({});
      });

      it('resets isClosing to false', () => {
        const state = createState({ isClosing: true });

        mutations.open(state, { component: MockComponentA });

        expect(state.isClosing).toStrictEqual(false);
      });
    });

    describe('close', () => {
      it('sets isClosing to true and isOpen to false immediately', () => {
        const state = createState({ isOpen: true, component: MockComponentA as any });

        mutations.close(state);

        expect(state.isClosing).toStrictEqual(true);
        expect(state.isOpen).toStrictEqual(false);
        expect(state.component).toStrictEqual(MockComponentA);
      });

      it('retains component and componentProps before the 500ms delay elapses', () => {
        const state = createState({
          isOpen:         true,
          component:      MockComponentA as any,
          componentProps: { title: 'Test' }
        });

        mutations.close(state);
        jest.advanceTimersByTime(499);

        expect(state.component).toStrictEqual(MockComponentA);
        expect(state.componentProps).toStrictEqual({ title: 'Test' });
        expect(state.isClosing).toStrictEqual(true);
      });

      it('clears component and props after 500ms transition', () => {
        const state = createState({
          isOpen:         true,
          component:      MockComponentA as any,
          componentProps: { title: 'Test' }
        });

        mutations.close(state);

        expect(state.component).toStrictEqual(MockComponentA);
        expect(state.componentProps).toStrictEqual({ title: 'Test' });

        jest.advanceTimersByTime(500);

        expect(state.component).toStrictEqual(null);
        expect(state.componentProps).toStrictEqual({});
        expect(state.isClosing).toStrictEqual(false);
      });
    });

    describe('close-then-open race condition', () => {
      it('cancels pending close timer when open is called', () => {
        const state = createState({
          isOpen:    true,
          component: MockComponentA as any
        });

        mutations.close(state);

        expect(state.isOpen).toStrictEqual(false);
        expect(state.isClosing).toStrictEqual(true);

        mutations.open(state, { component: MockComponentB, componentProps: { title: 'Panel B' } });

        expect(state.isOpen).toStrictEqual(true);
        expect(state.isClosing).toStrictEqual(false);
        expect(state.component).toStrictEqual(MockComponentB);
        expect(state.componentProps).toStrictEqual({ title: 'Panel B' });

        jest.advanceTimersByTime(500);

        expect(state.component).toStrictEqual(MockComponentB);
        expect(state.componentProps).toStrictEqual({ title: 'Panel B' });
        expect(state.isClosing).toStrictEqual(false);
      });
    });
  });
});
