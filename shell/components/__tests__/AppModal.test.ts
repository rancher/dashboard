/* eslint-disable jest/no-hooks */
import { mount, VueWrapper } from '@vue/test-utils';
import AppModal from '@shell/components/AppModal.vue';

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
