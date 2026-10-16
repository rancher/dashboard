/* eslint-disable jest/no-hooks */
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { createFocusTrap } from 'focus-trap';
import RcModal from '../RcModal.vue';
import { useModal } from '../useModal';

jest.mock('focus-trap', () => ({
  createFocusTrap: jest.fn(() => ({
    activate:   jest.fn(),
    deactivate: jest.fn(),
  })),
}));

const dialog = () => document.querySelector('#modals .rc-modal') as HTMLElement;

describe('composable: useModal', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="modals"></div>';
    (createFocusTrap as jest.Mock).mockClear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    document.body.style.overflow = '';
  });

  describe('visibility', () => {
    it('should start closed, and start open when asked to', () => {
      expect(useModal().isOpen.value).toBe(false);
      expect(useModal({ open: true }).isOpen.value).toBe(true);
    });

    it('should open and close', () => {
      const { isOpen, open, close } = useModal();

      open();
      expect(isOpen.value).toBe(true);

      close();
      expect(isOpen.value).toBe(false);
    });

    it('should expose isOpen as a writable ref, for the cases the helpers do not cover', () => {
      const { isOpen, modal } = useModal();

      expect(modal.value.show).toBe(false);

      isOpen.value = true;

      expect(modal.value.show).toBe(true);
    });

    it('should hand the same close function to the modal object every time', () => {
      const { modal, isOpen } = useModal();
      const first = modal.value.onClose;

      isOpen.value = true;

      expect(modal.value.onClose).toBe(first);
    });

    it('should carry the value it was opened with', () => {
      const { open, payload } = useModal<{ name: string }>();

      expect(payload.value).toBeUndefined();

      open({ name: 'my-namespace' });

      expect(payload.value).toStrictEqual({ name: 'my-namespace' });
    });

    it('should replace the payload when it is opened again', () => {
      const { open, payload } = useModal<string>();

      open('my-namespace');
      open('my-other-namespace');

      expect(payload.value).toStrictEqual('my-other-namespace');
    });

    it('should clear the payload when opened with nothing', () => {
      const { open, payload } = useModal<string>();

      open('my-namespace');
      open();

      expect(payload.value).toBeUndefined();
    });
  });

  describe('refusing to close', () => {
    it('should stay open when onClose returns false', () => {
      const { isOpen, open, close } = useModal({ onClose: () => false });

      open();
      close();

      expect(isOpen.value).toBe(true);
    });

    it.each([
      ['true', true],
      ['nothing', undefined],
    ])('should close when onClose returns %s', (_label, result?: boolean) => {
      const { isOpen, open, close } = useModal({ onClose: () => result });

      open();
      close();

      expect(isOpen.value).toBe(false);
    });

    it('should hand onClose whatever it was opened with, so it can decide per item', () => {
      const onClose = jest.fn(() => false);
      const { open, close } = useModal<string>({ onClose });

      open('my-namespace');
      close();

      expect(onClose).toHaveBeenCalledWith('my-namespace');
    });
  });

  describe('wiring RcModal', () => {
    const Host = defineComponent({
      setup() {
        const { open, modal } = useModal();

        return { open, modal };
      },
      render() {
        return [
          h('button', { class: 'trigger', onClick: () => this.open() }, 'Open'),
          h(
            RcModal,
            { ...this.modal, title: 'Are you sure?' },
            { 'primary-action': () => h('button', { class: 'confirm' }, 'Delete') },
          ),
        ];
      },
    });

    it('should open the modal from the trigger and close it on the modal\'s own close event', async() => {
      const wrapper = mount(Host, { attachTo: document.body });

      expect(dialog()).toBeNull();

      (document.querySelector('.trigger') as HTMLElement).click();
      await nextTick();

      expect(dialog()).toBeTruthy();

      dialog().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await nextTick();

      expect(dialog()).toBeNull();

      wrapper.unmount();
    });

    it('should close from the background and from the supplied cancel button too', async() => {
      const wrapper = mount(Host, { attachTo: document.body });

      (document.querySelector('.trigger') as HTMLElement).click();
      await nextTick();

      (document.querySelector('.rc-modal-overlay') as HTMLElement).dispatchEvent(new MouseEvent('click'));
      await nextTick();

      expect(dialog()).toBeNull();

      (document.querySelector('.trigger') as HTMLElement).click();
      await nextTick();

      (document.querySelector('[data-testid="rc-modal-cancel"]') as HTMLElement).click();
      await nextTick();

      expect(dialog()).toBeNull();

      wrapper.unmount();
    });
  });
});
