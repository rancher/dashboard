import { mount } from '@vue/test-utils';
import { createStore, Store } from 'vuex';
import { nextTick } from 'vue';

import ModalManager from '@shell/components/ModalManager.vue';

interface ModalManagerMethods {
  registerBackgroundClosing(fn: Function): void;
  close(): void;
}

const MockComponent = {
  template: '<div data-testid="modal-manager-component">Mock Content</div>',
  props:    ['someProp', 'resources', 'registerBackgroundClosing']
};

describe('modalManager.vue with Teleport', () => {
  let store: Store<any>;
  let getters: Record<string, () => any>;
  let modalsDiv: HTMLDivElement;

  beforeEach(() => {
    // Create the teleport target container
    modalsDiv = document.createElement('div');
    modalsDiv.setAttribute('id', 'modals');
    document.body.appendChild(modalsDiv);

    getters = {
      'modal/isOpen':              () => true,
      'modal/component':           () => MockComponent,
      'modal/componentProps':      () => ({ someProp: 'testValue' }),
      'modal/resources':           () => ({ data: 'mockData' }),
      'modal/closeOnClickOutside': () => true,
      'modal/modalWidth':          () => '500px'
    };

    store = createStore({
      getters,
      mutations: { 'modal/closeModal': jest.fn() }
    });
  });

  afterEach(() => {
    // Clean up the teleport container after each test
    document.body.removeChild(modalsDiv);
  });

  const factory = () => {
    return mount(ModalManager, {
      attachTo: document.body, // attach so Teleport can work properly
      global:   {
        plugins: [store],
        stubs:   {
          AppModal: {
            name:     'AppModal',
            template: `<div data-testid="app-modal" @close="$emit('close')" :style="{ '--prompt-modal-width': width }"><slot /></div>`,
            props:    ['clickToClose', 'width']
          }
        }
      }
    });
  };

  it('renders the AppModal and dynamic component when modal is open', async() => {
    factory();

    await nextTick();

    // Because Teleport moves content out of the normal wrapper,
    // we query the document for the teleported elements.
    const appModal = document.querySelector('[data-testid="app-modal"]');
    const dynamicComponent = document.querySelector('[data-testid="modal-manager-component"]');

    expect(appModal).toBeTruthy();
    expect(dynamicComponent).toBeTruthy();
    expect(appModal?.getAttribute('style')).toContain('--prompt-modal-width: 500px');

    // We assume the mock component is rendered correctly if its markup is found.
  });

  it('does not render the AppModal when modal is closed', async() => {
    getters['modal/isOpen'] = () => false;
    store = createStore({
      getters,
      mutations: { 'modal/closeModal': jest.fn() }
    });
    factory();
    await nextTick();

    const appModal = document.querySelector('[data-testid="app-modal"]');

    expect(appModal).toBeNull();
  });

  it('does not render the AppModal when dynamic component is null', async() => {
    getters['modal/component'] = () => null;
    store = createStore({
      getters,
      mutations: { 'modal/closeModal': jest.fn() }
    });
    factory();
    await nextTick();

    const appModal = document.querySelector('[data-testid="app-modal"]');

    expect(appModal).toBeNull();
  });

  it('calls store commit when close is triggered', async() => {
    const closeModalMutation = jest.fn();

    getters['modal/isOpen'] = () => true;
    store = createStore({
      getters,
      mutations: { 'modal/closeModal': closeModalMutation }
    });
    const wrapper = factory();

    await nextTick();

    const appModalWrapper = wrapper.findComponent({ name: 'AppModal' });

    appModalWrapper.vm.$emit('close');
    await nextTick();

    expect(closeModalMutation).toHaveBeenCalledWith({}, undefined);
  });

  it('calls registered background closing function on close', async() => {
    const closeModalMutation = jest.fn();

    getters['modal/isOpen'] = () => true;
    store = createStore({
      getters,
      mutations: { 'modal/closeModal': closeModalMutation }
    });
    const wrapper = factory();

    await nextTick();

    const backgroundFn = jest.fn();

    (wrapper.vm as unknown as ModalManagerMethods).registerBackgroundClosing(backgroundFn);
    await nextTick();

    const appModalWrapper = wrapper.findComponent({ name: 'AppModal' });

    appModalWrapper.vm.$emit('close');
    await nextTick();

    expect(backgroundFn).toHaveBeenCalledWith();
    expect(closeModalMutation).toHaveBeenCalledWith({}, undefined);
  });

  it('does nothing if modal is already closed when close is triggered', async() => {
    const closeModalMutation = jest.fn();

    getters['modal/isOpen'] = () => false;
    store = createStore({
      getters,
      mutations: { 'modal/closeModal': closeModalMutation }
    });
    const wrapper = factory();

    await nextTick();

    const modalManager = wrapper.vm as unknown as ModalManagerMethods;
    const spy = jest.spyOn(modalManager, 'close');

    modalManager.close();
    await nextTick();

    expect(spy).toHaveBeenCalledWith();
    expect(closeModalMutation).not.toHaveBeenCalled();
  });
});
