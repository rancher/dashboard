import { mount } from '@vue/test-utils';
import { createStore, Store } from 'vuex';
import { nextTick } from 'vue';
import SlideInPanelManager from '@shell/components/SlideInPanelManager.vue';

const MockComponent = {
  template: '<div data-testid="slide-in-panel-component">Mock Panel Content</div>',
  props:    ['width', 'title', 'extraProp']
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
      'slideInPanel/panelOptions':   () => ({ width: '40%', title: 'Test Title' }),
      'slideInPanel/componentProps': () => ({ extraProp: 'extra' })
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

    expect(styleAttr).toContain('width: 40%');
    expect(styleAttr).toContain('top: 55px');
    expect(styleAttr).toContain('height: calc(100vh - 55px)');
    expect(styleAttr).toContain('right: 0');
  });

  it('renders default panel title when no title is provided', async() => {
    // Update getter so that no title is provided
    getters['slideInPanel/panelOptions'] = () => ({ width: '40%' });
    store = createStore({
      getters,
      mutations: { 'slideInPanel/close': jest.fn() }
    });
    factory();
    await nextTick();

    const headerTitle = document.querySelector('#slides #slide-in-panel-manager .header .title') as HTMLElement;

    expect(headerTitle.textContent?.trim()).toBe('Details');
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

    // With currentProps width "40%", panelRight should be "-40%" when closed.
    expect(styleAttr).toContain('right: -40%');
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

    const closeIcon = document.querySelector('[data-testid="slide-in-close"]') as HTMLElement;

    closeIcon.click();
    await nextTick();

    expect(closeMutation).toHaveBeenCalledWith({}, undefined);
  });
});
