/* eslint-disable jest/no-hooks */
import { h, nextTick } from 'vue';
import { mount, VueWrapper } from '@vue/test-utils';
import { createFocusTrap } from 'focus-trap';
import RcModal from './RcModal.vue';
import { widthFor } from './widths';
import type { RcModalSize } from './types';

jest.mock('focus-trap', () => ({
  createFocusTrap: jest.fn((el, opts) => ({
    activate: jest.fn(() => {
      const tabbable = el?.querySelector?.('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');

      if (!tabbable && !opts?.fallbackFocus) {
        throw new Error('Your focus-trap must have at least one container with at least one tabbable node in it at all times');
      }
    }),
    deactivate: jest.fn(),
  })),
}));

type MountOptions = Parameters<typeof mount>[1];

const mountModal = (options: MountOptions = {}): VueWrapper => mount(RcModal, {
  attachTo: document.body,
  ...options,
  props:    {
    show: true, title: 'Are you sure?', ...(options?.props || {})
  },
});

const dialog = () => document.querySelector('#modals .rc-modal') as HTMLElement;


describe('component: RcModal', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="modals"></div>';
    (createFocusTrap as jest.Mock).mockClear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('layout', () => {
    it('should render the title, the body and the actions as siblings, in that order', () => {
      const wrapper = mountModal({
        slots: {
          default: '<p class="body-content">Body</p>',
          actions: '<button class="action-button">Delete</button>',
        },
      });

      const rendered = Array.from(dialog().querySelectorAll(':scope > .rc-modal__title, :scope > .rc-modal__body, :scope > .rc-modal__actions'))
        .map((el) => el.className);

      expect(rendered).toStrictEqual(['rc-modal__title', 'rc-modal__body', 'rc-modal__actions']);
      expect(dialog().querySelector('.rc-modal__title')?.textContent?.trim()).toStrictEqual('Are you sure?');
      expect(dialog().querySelector('.rc-modal__body .body-content')).toBeTruthy();
      expect(dialog().querySelector('.rc-modal__actions .action-button')).toBeTruthy();

      wrapper.unmount();
    });

    it('should not render the actions row when neither footer slot is given', () => {
      const wrapper = mountModal();

      expect(document.querySelector('.rc-modal__actions')).toBeNull();

      wrapper.unmount();
    });

    it('should pair the primary-action slot with a cancel button', () => {
      const wrapper = mountModal({ slots: { 'primary-action': '<button class="confirm">Delete</button>' } });

      const actions = document.querySelector('.rc-modal__actions') as HTMLElement;

      expect(actions.querySelector('[data-testid="rc-modal-cancel"]')).toBeTruthy();
      expect(actions.querySelector('[data-testid="rc-modal-cancel"]')?.textContent?.trim()).toStrictEqual('%generic.cancel%');
      expect(actions.querySelector('.confirm')).toBeTruthy();
      expect(actions.querySelector('[data-testid="rc-modal-cancel"]')?.compareDocumentPosition(actions.querySelector('.confirm') as Node))
        .toBe(Node.DOCUMENT_POSITION_FOLLOWING);

      wrapper.unmount();
    });

    it('should let the actions slot replace the whole footer, cancel button included', () => {
      const wrapper = mountModal({ slots: { actions: '<button class="only">Just this</button>' } });

      const actions = document.querySelector('.rc-modal__actions') as HTMLElement;

      expect(actions.querySelector('.only')).toBeTruthy();
      expect(actions.querySelector('[data-testid="rc-modal-cancel"]')).toBeNull();

      wrapper.unmount();
    });

    it('should let the title slot replace the title prop', () => {
      const wrapper = mountModal({ slots: { title: '<em class="rich-title">Restore <b>snapshot</b></em>' } });

      const title = document.querySelector('.rc-modal__title');

      expect(title?.querySelector('.rich-title')).toBeTruthy();
      expect(title?.textContent).not.toContain('Are you sure?');

      wrapper.unmount();
    });

    it('should render no heading when neither the title prop nor the title slot is given', () => {
      const wrapper = mount(RcModal, { attachTo: document.body, props: { show: true } });

      expect(document.querySelector('.rc-modal__title')).toBeNull();
      expect(dialog().getAttribute('aria-labelledby')).toBeNull();

      wrapper.unmount();
    });

    it('should teleport itself into the modals container', () => {
      const wrapper = mountModal();

      expect(dialog()).toBeTruthy();
      expect(document.querySelector('#modals .rc-modal-overlay')).toBeTruthy();

      wrapper.unmount();
    });
  });

  describe('size', () => {
    // The width reaches the DOM through a `v-bind()` custom property, and jest
    // compiles no SFC styles, so the mapping is asserted on its own.
    it.each([
      ['small', '480px'],
      ['medium', '640px'],
      ['large', '960px'],
    ])('should size a %s modal to %s', (size, expected) => {
      expect(widthFor(size as RcModalSize)).toStrictEqual(expected);
    });

    it.each([
      [undefined],
      [null],
      ['enormous'],
    ])('should fall back to medium for %s', (size) => {
      expect(widthFor(size as RcModalSize)).toStrictEqual('640px');
    });

    it('should leave the dialog without an inline width, so its content can widen it', () => {
      const wrapper = mountModal();

      expect(dialog().style.width).toStrictEqual('');

      wrapper.unmount();
    });
  });

  describe('accessibility', () => {
    it('should name the dialog with its own title', () => {
      const wrapper = mountModal();
      const el = dialog();

      expect(el.getAttribute('role')).toStrictEqual('dialog');
      expect(el.getAttribute('aria-modal')).toStrictEqual('true');
      expect(document.getElementById(el.getAttribute('aria-labelledby') as string)?.textContent?.trim()).toStrictEqual('Are you sure?');

      wrapper.unmount();
    });

    it('should give each modal a distinct title id', () => {
      const first = mountModal();
      const second = mountModal({ props: { title: 'Move to a new project?' } });

      const ids = Array.from(document.querySelectorAll('#modals .rc-modal'))
        .map((el) => el.getAttribute('aria-labelledby'));

      expect(ids).toHaveLength(2);
      expect(ids[0]).not.toStrictEqual(ids[1]);

      first.unmount();
      second.unmount();
    });

    it('should make the dialog focusable without adding it to the tab order', () => {
      const wrapper = mountModal();

      expect(dialog().getAttribute('tabindex')).toStrictEqual('-1');

      wrapper.unmount();
    });

    it('should hold the trap until the modal is gone, rather than let focus-trap release it', () => {
      // Both options otherwise let the user out of the trap while the modal is
      // still on screen: Escape tears it down, an outside click drops focus to
      // the body. Whether either dismisses the modal is the modal's decision.
      const wrapper = mountModal({ props: { clickToClose: false } });

      const opts = (createFocusTrap as jest.Mock).mock.calls[0][1];

      expect(opts.escapeDeactivates).toBe(false);
      expect(opts.allowOutsideClick()).toBe(false);

      wrapper.unmount();
    });

    it('should let an outside click through when the modal is dismissable, so the backdrop can close it', () => {
      const wrapper = mountModal({ props: { clickToClose: true } });

      const opts = (createFocusTrap as jest.Mock).mock.calls[0][1];

      expect(opts.allowOutsideClick()).toBe(true);

      wrapper.unmount();
    });

    it('should deactivate the trap when it closes, so focus returns to the trigger', async() => {
      const wrapper = mountModal();

      await nextTick();
      await nextTick();

      const trap = (createFocusTrap as jest.Mock).mock.results[0].value;

      await wrapper.setProps({ show: false });

      expect(trap.deactivate).toHaveBeenCalledWith();

      wrapper.unmount();
    });

    it('should still activate the focus trap when the modal holds nothing tabbable', async() => {
      const wrapper = mountModal({ slots: { default: '<p>Restoring the snapshot, this may take a while.</p>' } });

      await nextTick();
      await nextTick();

      const trap = (createFocusTrap as jest.Mock).mock.results[0].value;

      expect(createFocusTrap).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ fallbackFocus: expect.stringContaining('#rc-modal-') })
      );
      expect(trap.activate.mock.results[0].type).toStrictEqual('return');

      wrapper.unmount();
    });
  });

  describe('show prop', () => {
    it('should render nothing while closed', () => {
      const wrapper = mountModal({ props: { show: false } });

      expect(document.querySelector('.rc-modal')).toBeNull();
      expect(document.querySelector('.rc-modal-overlay')).toBeNull();

      wrapper.unmount();
    });

    it('should render once shown, and tear down again when hidden', async() => {
      const wrapper = mountModal({ props: { show: false } });

      await wrapper.setProps({ show: true });
      expect(document.querySelector('.rc-modal')).toBeTruthy();

      await wrapper.setProps({ show: false });
      expect(document.querySelector('.rc-modal')).toBeNull();

      wrapper.unmount();
    });

    it('should arm the focus trap again when reopened', async() => {
      const wrapper = mountModal({ props: { show: false } });

      await wrapper.setProps({ show: true });
      await wrapper.setProps({ show: false });
      await wrapper.setProps({ show: true });
      await nextTick();

      expect((createFocusTrap as jest.Mock)).toHaveBeenCalledTimes(2);

      wrapper.unmount();
    });
  });

  describe('closing', () => {
    it('should emit close when the background is clicked', () => {
      const wrapper = mountModal();

      (document.querySelector('.rc-modal-overlay') as HTMLElement).dispatchEvent(new MouseEvent('click'));

      expect(wrapper.emitted('close')).toHaveLength(1);

      wrapper.unmount();
    });

    it('should not emit close when the dialog itself is clicked', () => {
      const wrapper = mountModal();

      dialog().dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(wrapper.emitted('close')).toBeUndefined();

      wrapper.unmount();
    });

    it('should emit close when Escape is pressed', () => {
      const wrapper = mountModal();

      dialog().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(wrapper.emitted('close')).toHaveLength(1);

      wrapper.unmount();
    });

    it('should not close on background click or Escape when clickToClose is false', () => {
      const wrapper = mountModal({ props: { clickToClose: false } });

      (document.querySelector('.rc-modal-overlay') as HTMLElement).dispatchEvent(new MouseEvent('click'));
      dialog().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(wrapper.emitted('close')).toBeUndefined();

      wrapper.unmount();
    });

    it('should emit cancel before close when the user backs out', () => {
      const wrapper = mountModal();

      dialog().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(wrapper.emitted('cancel')).toHaveLength(1);
      expect(wrapper.emitted('close')).toHaveLength(1);

      wrapper.unmount();
    });

    it.each([
      ['primary-action'],
      ['actions'],
    ])('should hand cancel and close to the %s slot', (slotName) => {
      const wrapper = mountModal({
        slots: {
          [slotName]: (context: { cancel: () => void; close: () => void }) => [
            h('button', { class: 'slot-cancel', onClick: context.cancel }, 'Cancel'),
            h('button', { class: 'slot-close', onClick: context.close }, 'Confirm'),
          ],
        },
      });

      (document.querySelector('.slot-close') as HTMLElement).click();

      expect(wrapper.emitted('close')).toHaveLength(1);
      expect(wrapper.emitted('cancel')).toBeUndefined();

      (document.querySelector('.slot-cancel') as HTMLElement).click();

      expect(wrapper.emitted('cancel')).toHaveLength(1);
      expect(wrapper.emitted('close')).toHaveLength(2);

      wrapper.unmount();
    });

    it('should close from the default cancel button', async() => {
      const wrapper = mountModal({ slots: { 'primary-action': '<button class="confirm">Delete</button>' } });

      await (document.querySelector('[data-testid="rc-modal-cancel"]') as HTMLElement).click();

      expect(wrapper.emitted('cancel')).toHaveLength(1);
      expect(wrapper.emitted('close')).toHaveLength(1);

      wrapper.unmount();
    });

    it('should leave no document-level Escape listener behind once unmounted', () => {
      const wrapper = mountModal();

      wrapper.unmount();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(wrapper.emitted('close')).toBeUndefined();
    });
  });

  describe('attributes', () => {
    it('should merge a fallthrough class onto the dialog, so consumers can still be selected', () => {
      const wrapper = mountModal({ attrs: { class: 'prompt-remove' } });

      expect(dialog().classList).toContain('rc-modal');
      expect(dialog().classList).toContain('prompt-remove');

      wrapper.unmount();
    });

    it('should pass fallthrough attributes down to the dialog element', () => {
      const wrapper = mountModal({ attrs: { 'data-testid': 'my-modal' } });

      expect(dialog().getAttribute('data-testid')).toStrictEqual('my-modal');

      wrapper.unmount();
    });
  });
});
