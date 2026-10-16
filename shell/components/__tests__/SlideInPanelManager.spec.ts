import { mount } from '@vue/test-utils';
import { createStore, Store } from 'vuex';
import { nextTick } from 'vue';
import SlideInPanelManager from '@shell/components/SlideInPanelManager.vue';
import { useWatcherBasedSetupFocusTrapWithDestroyIncluded } from '@shell/composables/focusTrap';

jest.mock('@shell/composables/focusTrap', () => ({
  ...jest.requireActual('@shell/composables/focusTrap'),
  useWatcherBasedSetupFocusTrapWithDestroyIncluded: jest.fn(),
}));

const MockComponent = {
  template: '<div data-testid="slide-in-panel-component">Mock Panel Content</div>',
  props:    ['title', 'extraProp']
};

const ClosingComponent = {
  template: '<div><button data-testid="mock-panel-close" @click="$emit(\'close\')">Close</button></div>',
  emits:    ['close']
};

describe('slideInPanelManager.vue with Teleport', () => {
  let store: Store<any>;
  let getters: Record<string, () => any>;
  let slidesDiv: HTMLDivElement;

  beforeEach(() => {
    // Create teleport target container
    slidesDiv = document.createElement('div');
    slidesDiv.setAttribute('id', 'slides');
    document.body.appendChild(slidesDiv);

    getters = {
      'slideInPanel/isOpen':         () => true,
      'slideInPanel/component':      () => MockComponent,
      'slideInPanel/componentProps': () => ({
        width: 'default', title: 'Test Title', extraProp: 'extra'
      })
    };

    store = createStore({
      getters,
      mutations: { 'slideInPanel/close': jest.fn() }
    });
  });

  afterEach(() => {
    // Clean up the teleport container
    document.body.removeChild(slidesDiv);
  });

  const factory = () => {
    return mount(SlideInPanelManager, {
      attachTo: document.body, // attach to document so Teleport renders
      global:   { plugins: [store] }
    });
  };

  it('renders slide in panel with proper style when open', async() => {
    factory();
    await nextTick();

    const slidePanel = document.querySelector('#slides .slide-in') as HTMLElement;
    const slideGlass = document.querySelector('[data-testid="slide-in-glass"]') as HTMLElement;
    const slideComponent = document.querySelector('[data-testid="slide-in-panel-component"]') as HTMLElement;
    const headerTitle = document.querySelector('#slides .slide-in .header .title') as HTMLElement;

    expect(slidePanel).toBeTruthy();
    expect(slideGlass).toBeTruthy();
    expect(slideComponent).toBeTruthy();
    expect(headerTitle.textContent?.trim()).toBe('Test Title');

    const styleAttr = slidePanel.getAttribute('style') || '';

    expect(styleAttr).toContain('width: 33%');
    expect(styleAttr).toContain('top: 55px');
    expect(styleAttr).toContain('height: calc(100vh - 55px)');
    expect(styleAttr).toContain('right: 0');
  });

  it('hides header when no title is provided', async() => {
    getters['slideInPanel/componentProps'] = () => ({});
    store = createStore({
      getters,
      mutations: { 'slideInPanel/close': jest.fn() }
    });
    factory();
    await nextTick();

    const header = document.querySelector('#slides #slide-in-panel-manager .header') as HTMLElement;

    expect(header).toBeNull();
  });

  it('computes panelTop correctly when a banner exists', async() => {
    // Create a banner element with a simulated clientHeight.
    const banner = document.createElement('div');

    banner.setAttribute('id', 'banner-header');
    document.body.appendChild(banner);
    // Simulate a banner with a clientHeight of 100.
    Object.defineProperty(banner, 'clientHeight', { value: 100, configurable: true });

    factory();
    await nextTick();

    const slidePanel = document.querySelector('#slides .slide-in') as HTMLElement;
    const styleAttr = slidePanel.getAttribute('style') || '';

    // Expected panelTop = HEADER_HEIGHT (55) + banner.clientHeight (100) = "155px"
    expect(styleAttr).toContain('top: 155px');
    expect(styleAttr).toContain('height: calc(100vh - 155px)');

    document.body.removeChild(banner);
  });

  it('renders slide in glass as hidden and panel with negative right when closed', async() => {
    // Set isOpen to false.
    getters['slideInPanel/isOpen'] = () => false;
    store = createStore({
      getters,
      mutations: { 'slideInPanel/close': jest.fn() }
    });
    factory();
    await nextTick();

    const slideGlass = document.querySelector('[data-testid="slide-in-glass"]') as HTMLElement;

    expect(slideGlass).toBeTruthy();
    expect(slideGlass.style.display).toBe('none');

    const slidePanel = document.querySelector('#slides .slide-in') as HTMLElement;
    const styleAttr = slidePanel.getAttribute('style') || '';

    // With default width preset (33%), panelRight should be "-33%" when closed.
    expect(styleAttr).toContain('right: -33%');
  });

  it('calls store commit when clicking on the slide-in glass overlay', async() => {
    const closeMutation = jest.fn();

    getters['slideInPanel/isOpen'] = () => true;
    store = createStore({
      getters,
      mutations: { 'slideInPanel/close': closeMutation }
    });
    factory();
    await nextTick();

    const slideGlass = document.querySelector('[data-testid="slide-in-glass"]') as HTMLElement;

    slideGlass.click();
    await nextTick();

    expect(closeMutation).toHaveBeenCalledWith({}, undefined);
  });

  it('calls store commit when clicking on the slide-in close icon', async() => {
    const closeMutation = jest.fn();

    getters['slideInPanel/isOpen'] = () => true;
    store = createStore({
      getters,
      mutations: { 'slideInPanel/close': closeMutation }
    });
    factory();
    await nextTick();

    const closeIcon = document.querySelector('[data-testid="rc-drawer-close"]') as HTMLElement;

    closeIcon.click();
    await nextTick();

    expect(closeMutation).toHaveBeenCalledWith({}, undefined);
  });

  describe('panel asking to be closed', () => {
    const mountClosing = (componentProps: Record<string, unknown>) => {
      const closeMutation = jest.fn();

      getters['slideInPanel/component'] = () => ClosingComponent;
      getters['slideInPanel/componentProps'] = () => componentProps;
      store = createStore({
        getters,
        mutations: { 'slideInPanel/close': closeMutation }
      });
      factory();

      return closeMutation;
    };

    const emitClose = async() => {
      await nextTick();
      (document.querySelector('[data-testid="mock-panel-close"]') as HTMLElement).click();
      await nextTick();
    };

    it.each([
      ['a panel that renders its own drawer', {}],
      ['a titled panel', { title: 'Test Title' }],
    ])('closes when %s emits close', async(_, componentProps) => {
      const closeMutation = mountClosing(componentProps);

      await emitClose();

      expect(closeMutation).toHaveBeenCalledWith({}, undefined);
    });

    it('leaves closing to the handler the panel was opened with, when it has one', async() => {
      const onClose = jest.fn();
      const closeMutation = mountClosing({ onClose });

      await emitClose();

      expect(onClose).toHaveBeenCalledWith();
      expect(closeMutation).not.toHaveBeenCalledWith({}, undefined);
    });
  });

  it('mounts a new panel instance for every open', async() => {
    const mounted = jest.fn();
    const state = { openCount: 1 };

    store = createStore({
      state,
      getters: {
        ...getters,
        'slideInPanel/component': () => ({ template: '<div />', mounted }),
        'slideInPanel/openCount': (s: typeof state) => s.openCount,
      },
      mutations: {
        'slideInPanel/close': jest.fn(),
        reopen(s: typeof state) {
          s.openCount++;
        }
      }
    });
    factory();
    await nextTick();
    store.commit('reopen');
    await nextTick();

    expect(mounted).toHaveBeenCalledTimes(2);
  });

  describe('escape key', () => {
    const pressEscapeOn = (target: EventTarget) => target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    const mountWith = (isOpen: boolean) => {
      const closeMutation = jest.fn();

      getters['slideInPanel/isOpen'] = () => isOpen;
      store = createStore({
        getters,
        mutations: { 'slideInPanel/close': closeMutation }
      });

      return { wrapper: factory(), closeMutation };
    };

    it('closes when escape is pressed inside the panel', async() => {
      const { closeMutation } = mountWith(true);

      await nextTick();
      pressEscapeOn(document.querySelector('[data-testid="slide-in-panel-component"]') as HTMLElement);

      expect(closeMutation).toHaveBeenCalledWith({}, undefined);
    });

    it('closes when escape is pressed after focus has fallen back to the body', async() => {
      const { closeMutation } = mountWith(true);

      await nextTick();
      pressEscapeOn(document.body);

      expect(closeMutation).toHaveBeenCalledWith({}, undefined);
    });

    it('leaves escape alone when it is pressed elsewhere on the page', async() => {
      const { closeMutation } = mountWith(true);
      const elsewhere = document.createElement('input');

      document.body.appendChild(elsewhere);
      await nextTick();
      pressEscapeOn(elsewhere);
      document.body.removeChild(elsewhere);

      expect(closeMutation).not.toHaveBeenCalledWith({}, undefined);
    });

    it('ignores escape while closed', async() => {
      const { closeMutation } = mountWith(false);

      await nextTick();
      pressEscapeOn(document.body);

      expect(closeMutation).not.toHaveBeenCalledWith({}, undefined);
    });

    it('stops listening once unmounted', async() => {
      const { wrapper, closeMutation } = mountWith(true);

      await nextTick();
      wrapper.unmount();
      closeMutation.mockClear();
      pressEscapeOn(document.body);

      expect(closeMutation).not.toHaveBeenCalledWith({}, undefined);
    });
  });

  describe('initial focus', () => {
    const openPanel = async(componentProps: Record<string, unknown>) => {
      const state = { isOpen: false };

      store = createStore({
        state,
        getters: {
          ...getters,
          'slideInPanel/isOpen':         (s: typeof state) => s.isOpen,
          'slideInPanel/isClosing':      () => false,
          'slideInPanel/componentProps': () => componentProps,
        },
        mutations: {
          'slideInPanel/close': jest.fn(),
          open(s: typeof state) {
            s.isOpen = true;
          }
        }
      });
      factory();
      await nextTick();
      store.commit('open');
      await nextTick();

      return (useWatcherBasedSetupFocusTrapWithDestroyIncluded as jest.Mock).mock.lastCall[2];
    };

    it('lands on the close button of the drawer chrome', async() => {
      const opts = await openPanel({ title: 'Test Title' });

      expect(opts.initialFocus()).toBe(document.querySelector('#slides [data-testid="rc-drawer-close"]'));
    });

    it('falls back to the panel when its content has no drawer chrome', async() => {
      const opts = await openPanel({});

      expect(opts.initialFocus()).toBe(document.querySelector('#slide-in-panel-manager'));
    });
  });

  describe('standard drawer chrome', () => {
    const chrome = () => document.querySelector('#slides .slide-in .rc-drawer') as HTMLElement;

    it('wraps a titled panel in the drawer chrome and a card', async() => {
      factory();
      await nextTick();

      expect(chrome()).toBeTruthy();
      expect(chrome().querySelector('.body > .rc-drawer-card > [data-testid="slide-in-panel-component"]')).toBeTruthy();
    });

    it('closes a titled panel from the close button in its footer', async() => {
      const closeMutation = jest.fn();

      store = createStore({
        getters,
        mutations: { 'slideInPanel/close': closeMutation }
      });
      factory();
      await nextTick();

      (chrome().querySelector('.footer button') as HTMLElement).click();
      await nextTick();

      expect(closeMutation).toHaveBeenCalledWith({}, undefined);
    });

    it('leaves a panel without a title to render its own chrome', async() => {
      getters['slideInPanel/componentProps'] = () => ({});
      store = createStore({
        getters,
        mutations: { 'slideInPanel/close': jest.fn() }
      });
      factory();
      await nextTick();

      expect(chrome()).toBeNull();
      expect(document.querySelector('#slides .slide-in .main-panel [data-testid="slide-in-panel-component"]')).toBeTruthy();
    });
  });

  describe('width preset', () => {
    it('resolves width "wide" to 73%', async() => {
      getters['slideInPanel/componentProps'] = () => ({ width: 'wide', title: 'Test' });
      store = createStore({
        getters,
        mutations: { 'slideInPanel/close': jest.fn() }
      });
      factory();
      await nextTick();

      const slidePanel = document.querySelector('#slides .slide-in') as HTMLElement;
      const styleAttr = slidePanel.getAttribute('style') || '';

      expect(styleAttr).toContain('width: 73%');
    });

    it('defaults to 33% when no width config is provided', async() => {
      getters['slideInPanel/componentProps'] = () => ({ title: 'Test' });
      store = createStore({
        getters,
        mutations: { 'slideInPanel/close': jest.fn() }
      });
      factory();
      await nextTick();

      const slidePanel = document.querySelector('#slides .slide-in') as HTMLElement;
      const styleAttr = slidePanel.getAttribute('style') || '';

      expect(styleAttr).toContain('width: 33%');
    });
  });

  describe('height preset', () => {
    it('resolves height "full" to 100vh with top 0', async() => {
      getters['slideInPanel/componentProps'] = () => ({ height: 'full', title: 'Test' });
      store = createStore({
        getters,
        mutations: { 'slideInPanel/close': jest.fn() }
      });
      factory();
      await nextTick();

      const slidePanel = document.querySelector('#slides .slide-in') as HTMLElement;
      const styleAttr = slidePanel.getAttribute('style') || '';

      expect(styleAttr).toContain('height: 100vh');
      expect(styleAttr).toContain('top: 0');
    });

    it('keeps a full-height panel on the slide-in layer so modals and tooltips stay above it', async() => {
      getters['slideInPanel/componentProps'] = () => ({ height: 'full', title: 'Test' });
      store = createStore({
        getters,
        mutations: { 'slideInPanel/close': jest.fn() }
      });
      factory();
      await nextTick();

      const slidePanel = document.querySelector('#slides .slide-in') as HTMLElement;
      const slideGlass = document.querySelector('[data-testid="slide-in-glass"]') as HTMLElement;

      expect(slidePanel.style.zIndex).toBe('');
      expect(slideGlass.style.zIndex).toBe('');
    });
  });

  describe('showHeader inferred from title', () => {
    it('shows header when title is provided', async() => {
      getters['slideInPanel/componentProps'] = () => ({ title: 'My Panel' });
      store = createStore({
        getters,
        mutations: { 'slideInPanel/close': jest.fn() }
      });
      factory();
      await nextTick();

      const header = document.querySelector('#slides .slide-in .header') as HTMLElement;

      expect(header).toBeTruthy();
      expect(header.textContent?.trim()).toContain('My Panel');
    });

    it('hides header when no title is provided', async() => {
      getters['slideInPanel/componentProps'] = () => ({});
      store = createStore({
        getters,
        mutations: { 'slideInPanel/close': jest.fn() }
      });
      factory();
      await nextTick();

      const header = document.querySelector('#slides .slide-in .header') as HTMLElement;

      expect(header).toBeNull();
    });

    it('respects deprecated showHeader=true even without title', async() => {
      getters['slideInPanel/componentProps'] = () => ({ showHeader: true });
      store = createStore({
        getters,
        mutations: { 'slideInPanel/close': jest.fn() }
      });
      factory();
      await nextTick();

      const header = document.querySelector('#slides .slide-in .header') as HTMLElement;

      expect(header).toBeTruthy();
    });

    it('respects deprecated showHeader=false even with title', async() => {
      getters['slideInPanel/componentProps'] = () => ({ showHeader: false, title: 'Should Not Show' });
      store = createStore({
        getters,
        mutations: { 'slideInPanel/close': jest.fn() }
      });
      factory();
      await nextTick();

      const header = document.querySelector('#slides .slide-in .header') as HTMLElement;

      expect(header).toBeNull();
    });
  });

  describe('accessibility', () => {
    const panel = () => document.querySelector('#slides .slide-in') as HTMLElement;

    it('keeps the closed panel out of the accessibility tree and the tab order', async() => {
      getters['slideInPanel/isOpen'] = () => false;
      store = createStore({
        getters,
        mutations: { 'slideInPanel/close': jest.fn() }
      });
      factory();
      await nextTick();

      expect(panel().getAttribute('aria-hidden')).toBe('true');
      expect(panel().hasAttribute('inert')).toBe(true);
    });

    it('exposes the open panel and names it after its title', async() => {
      factory();
      await nextTick();

      expect(panel().getAttribute('aria-hidden')).toBe('false');
      expect(panel().hasAttribute('inert')).toBe(false);
      expect(panel().getAttribute('aria-label')).toBe('Test Title');
    });

    it('leaves the open panel unnamed when it has no title', async() => {
      getters['slideInPanel/componentProps'] = () => ({});
      store = createStore({
        getters,
        mutations: { 'slideInPanel/close': jest.fn() }
      });
      factory();
      await nextTick();

      expect(panel().hasAttribute('aria-label')).toBe(false);
    });
  });
});
