/* eslint-disable jest/no-hooks */
import { h, nextTick, ref } from 'vue';
import { mount, VueWrapper } from '@vue/test-utils';
import AppModal from '@shell/components/AppModal.vue';
import { Card } from '@components/Card';

let wrapper: VueWrapper<InstanceType<typeof AppModal>>;

describe('appModal', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="modals"></div>';
    wrapper = mount(AppModal, {
      attachTo: document.body,
      props:    {
        clickToClose: true,
        width:        600,
      },
      slots: { default: '<div class="content">Modal content</div>' }
    });
  });

  afterEach(() => {
    wrapper.unmount();
    document.body.innerHTML = '';
  });

  it('renders modal content', async() => {
    const modalContainer = document.querySelector('#modals .modal-container');

    expect(modalContainer).toBeTruthy();
    expect(modalContainer?.textContent).toContain('Modal content');
  });

  it('emits close event when clicked outside', async() => {
    const overlay = document.querySelector('.modal-overlay');

    expect(overlay).toBeTruthy();

    await overlay?.dispatchEvent(new Event('click'));
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits close event when escape key is pressed', async() => {
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key:     'Escape',
      keyCode: 27,
    }));
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('does not emit close event when clickToClose is false', async() => {
    await wrapper.setProps({ clickToClose: false });
    const overlay = document.querySelector('.modal-overlay');

    await overlay?.dispatchEvent(new Event('click'));
    expect(wrapper.emitted('close')).toBeFalsy();

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key:     'Escape',
      keyCode: 27,
    }));

    expect(wrapper.emitted('close')).toBeFalsy();
  });

  it('sets a width for the modal container', async() => {
    const container = document.querySelector('.modal-container');

    expect(container).toBeTruthy();
    expect(container?.style.width).toBe('600px');
  });

  it('sets a percentage width for the modal container', async() => {
    await wrapper.setProps({ width: '50%' });
    const container = document.querySelector('.modal-container');

    expect(container).toBeTruthy();
    expect(container?.style.width).toBe('50%');
  });

  it('does not generate validation errors when setting a pixel width', async() => {
    const consoleErrorSpy = jest.spyOn(console, 'warn');

    consoleErrorSpy.mockImplementation(() => {});

    await wrapper.setProps({ width: '200px' });
    const container = document.querySelector('.modal-container');

    expect(container).toBeTruthy();
    expect(container?.style.width).toBe('200px');

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('generates validation errors with an invalid string for width', async() => {
    const consoleErrorSpy = jest.spyOn(console, 'warn');

    consoleErrorSpy.mockImplementation(() => {});

    await wrapper.setProps({ width: 'FAIL' });
    const container = document.querySelector('.modal-container');

    expect(container).toBeTruthy();
    expect(container?.style.width).toBe('600px');

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });
});

describe('appModal accessible name', () => {
  const dialog = () => document.querySelector('.modal-container');

  // the MutationObserver watching the slot content reports asynchronously
  const settle = async() => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await nextTick();
  };

  beforeEach(() => {
    document.body.innerHTML = '<div id="modals"></div>';
  });

  afterEach(() => {
    wrapper?.unmount();
    document.body.innerHTML = '';
  });

  it('is not labelled when nothing renders the title id', async() => {
    wrapper = mount(AppModal, {
      attachTo: document.body,
      slots:    { default: '<div class="content">Modal content</div>' }
    });

    await settle();

    expect(dialog()?.getAttribute('aria-labelledby')).toBeNull();
  });

  it('is labelled by a title rendered with the id given to the default slot', async() => {
    wrapper = mount(AppModal, {
      attachTo: document.body,
      slots:    { default: (props: { titleId: string }) => h('h4', { id: props.titleId }, 'Slot title') }
    });

    await settle();

    const titleId = dialog()?.getAttribute('aria-labelledby');

    expect(titleId).toBeTruthy();
    expect(document.getElementById(titleId as string)?.textContent).toBe('Slot title');
  });

  it('is labelled by the title of a Card rendered as its content', async() => {
    wrapper = mount(AppModal, {
      attachTo: document.body,
      slots:    { default: () => h(Card, null, { title: () => h('h4', 'Card title') }) }
    });

    await settle();

    const titleId = dialog()?.getAttribute('aria-labelledby');

    expect(titleId).toBeTruthy();
    expect(document.getElementById(titleId as string)?.textContent).toBe('Card title');
  });

  it('is labelled once a title renders after the modal itself', async() => {
    const showTitle = ref(false);

    wrapper = mount(AppModal, {
      attachTo: document.body,
      slots:    { default: (props: { titleId: string }) => (showTitle.value ? h('h4', { id: props.titleId }, 'Late title') : h('div', 'Loading')) }
    });

    await settle();

    expect(dialog()?.getAttribute('aria-labelledby')).toBeNull();

    showTitle.value = true;
    await nextTick();
    await settle();

    expect(dialog()?.getAttribute('aria-labelledby')).toBeTruthy();
  });

  it('keeps an aria-labelledby provided by the caller', async() => {
    document.body.innerHTML = '<div id="modals"></div><h4 id="external-title">External title</h4>';

    wrapper = mount(AppModal, {
      attachTo: document.body,
      attrs:    { 'aria-labelledby': 'external-title' },
      slots:    { default: (props: { titleId: string }) => h('h4', { id: props.titleId }, 'Slot title') }
    });

    await settle();

    expect(dialog()?.getAttribute('aria-labelledby')).toBe('external-title');
  });
});
