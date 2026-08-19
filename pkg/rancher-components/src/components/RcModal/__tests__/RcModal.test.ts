/* eslint-disable jest/no-hooks */
import { h, nextTick } from 'vue';
import { mount, VueWrapper } from '@vue/test-utils';
import { createFocusTrap } from 'focus-trap';
import RcModal from '../RcModal.vue';
import { widthFor, type RcModalSize } from '../types';

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
    it('should group the title and the body in the content wrapper, with the actions beside it', () => {
      const wrapper = mountModal({
        slots: {
          default: '<p class="body-content">Body</p>',
          actions: '<button class="action-button">Delete</button>',
        },
      });

      const regions = Array.from(dialog().querySelectorAll(':scope > *')).map((el) => el.className);

      expect(regions).toStrictEqual(['content', 'actions']);

      const content = Array.from(dialog().querySelectorAll(':scope > .content > *')).map((el) => el.className);

      expect(content).toStrictEqual(['title', 'body']);
      expect(dialog().querySelector('[data-testid="rc-modal-title"]')?.textContent?.trim()).toStrictEqual('Are you sure?');
      expect(dialog().querySelector('[data-testid="rc-modal-body"] .body-content')).toBeTruthy();
      expect(dialog().querySelector('[data-testid="rc-modal-actions"] .action-button')).toBeTruthy();

      wrapper.unmount();
    });

    it('should not render the actions row when neither footer slot is given', () => {
      const wrapper = mountModal();

      expect(document.querySelector('[data-testid="rc-modal-actions"]')).toBeNull();

      wrapper.unmount();
    });

    it('should pair the primary-action slot with a cancel button', () => {
      const wrapper = mountModal({ slots: { 'primary-action': '<button class="confirm">Delete</button>' } });

      const actions = document.querySelector('[data-testid="rc-modal-actions"]') as HTMLElement;

      expect(actions.querySelector('[data-testid="rc-modal-cancel"]')).toBeTruthy();
      expect(actions.querySelector('[data-testid="rc-modal-cancel"]')?.textContent?.trim()).toStrictEqual('%generic.cancel%');
      expect(actions.querySelector('.confirm')).toBeTruthy();
      expect(actions.querySelector('[data-testid="rc-modal-cancel"]')?.compareDocumentPosition(actions.querySelector('.confirm') as Node))
        .toBe(Node.DOCUMENT_POSITION_FOLLOWING);

      wrapper.unmount();
    });

    it('should render the supplied cancel button at the size the footer is specced at', () => {
      const wrapper = mountModal({ slots: { 'primary-action': '<button class="confirm">Delete</button>' } });

      const cancel = document.querySelector('[data-testid="rc-modal-cancel"]') as HTMLElement;

      expect(Array.from(cancel.classList)).toContain('btn-large');

      wrapper.unmount();
    });

    it('should let the actions slot replace the whole footer, cancel button included', () => {
      const wrapper = mountModal({ slots: { actions: '<button class="only">Just this</button>' } });

      const actions = document.querySelector('[data-testid="rc-modal-actions"]') as HTMLElement;

      expect(actions.querySelector('.only')).toBeTruthy();
      expect(actions.querySelector('[data-testid="rc-modal-cancel"]')).toBeNull();

      wrapper.unmount();
    });

    it('should let the title slot replace the title prop', () => {
      const wrapper = mountModal({ slots: { title: '<em class="rich-title">Restore <b>snapshot</b></em>' } });

      const title = document.querySelector('[data-testid="rc-modal-title"]');

      expect(title?.querySelector('.rich-title')).toBeTruthy();
      expect(title?.textContent).not.toContain('Are you sure?');

      wrapper.unmount();
    });

    it('should render no heading when neither the title prop nor the title slot is given', () => {
      const wrapper = mount(RcModal, { attachTo: document.body, props: { show: true } });

      expect(document.querySelector('[data-testid="rc-modal-title"]')).toBeNull();
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

    it('should set no inline width on the dialog, since the custom property carries it', () => {
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

    it('should emit cancel then close when Escape is pressed, and nothing else', () => {
      const wrapper = mountModal();

      dialog().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(Object.keys(wrapper.emitted())).toStrictEqual(['open', 'cancel', 'close']);
      expect(wrapper.emitted('cancel')).toHaveLength(1);
      expect(wrapper.emitted('close')).toHaveLength(1);

      wrapper.unmount();
    });

    it('should stay open after emitting close, since the consumer owns the show prop', async() => {
      const wrapper = mountModal();

      dialog().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await nextTick();

      expect(wrapper.emitted('close')).toHaveLength(1);
      expect(dialog()).toBeTruthy();

      await wrapper.setProps({ show: false });

      expect(dialog()).toBeNull();

      wrapper.unmount();
    });

    it('should ignore keys that are not Escape', () => {
      const wrapper = mountModal();

      for (const key of ['Enter', ' ', 'a', 'Tab']) {
        dialog().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      }

      expect(wrapper.emitted('close')).toBeUndefined();
      expect(wrapper.emitted('cancel')).toBeUndefined();

      wrapper.unmount();
    });

    it('should not close on background click or Escape when clickToClose is false', () => {
      const wrapper = mountModal({ props: { clickToClose: false } });

      (document.querySelector('.rc-modal-overlay') as HTMLElement).dispatchEvent(new MouseEvent('click'));
      dialog().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(wrapper.emitted('close')).toBeUndefined();

      wrapper.unmount();
    });

    it.each([
      ['primary-action'],
      ['actions'],
    ])('should hand close to the %s slot', (slotName) => {
      const wrapper = mountModal({
        slots: {
          [slotName]: (context: { close: () => void }) => [
            h('button', { class: 'slot-close', onClick: context.close }, 'Confirm'),
          ],
        },
      });

      (document.querySelector('.slot-close') as HTMLElement).click();

      expect(wrapper.emitted('close')).toHaveLength(1);

      wrapper.unmount();
    });

    it('should close from the default cancel button', async() => {
      const wrapper = mountModal({ slots: { 'primary-action': '<button class="confirm">Delete</button>' } });

      await (document.querySelector('[data-testid="rc-modal-cancel"]') as HTMLElement).click();

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

  describe('events', () => {
    it('should emit open when it appears, and again when it is reopened', async() => {
      const wrapper = mountModal({ props: { show: false } });

      expect(wrapper.emitted('open')).toBeUndefined();

      await wrapper.setProps({ show: true });

      expect(wrapper.emitted('open')).toHaveLength(1);

      await wrapper.setProps({ show: false });
      await wrapper.setProps({ show: true });

      expect(wrapper.emitted('open')).toHaveLength(2);

      wrapper.unmount();
    });

    it('should emit cancel then close from the supplied cancel button', async() => {
      const wrapper = mountModal({ slots: { 'primary-action': '<button class="confirm">Delete</button>' } });

      await (document.querySelector('[data-testid="rc-modal-cancel"]') as HTMLElement).click();

      expect(wrapper.emitted('cancel')).toHaveLength(1);
      expect(wrapper.emitted('close')).toHaveLength(1);
      expect(wrapper.emitted('primary-action')).toBeUndefined();

      wrapper.unmount();
    });

    it('should emit cancel then close from a background click', () => {
      const wrapper = mountModal();

      (document.querySelector('.rc-modal-overlay') as HTMLElement).dispatchEvent(new MouseEvent('click'));

      expect(wrapper.emitted('cancel')).toHaveLength(1);
      expect(wrapper.emitted('close')).toHaveLength(1);

      wrapper.unmount();
    });

    it.each([
      ['primary-action'],
      ['actions'],
    ])('should hand close, cancel and primaryAction to the %s slot', (slotName) => {
      const wrapper = mountModal({
        slots: {
          [slotName]: (context: { close: () => void; cancel: () => void; primaryAction: () => void }) => [
            h('button', { class: 'slot-close', onClick: context.close }, 'Close'),
            h('button', { class: 'slot-cancel', onClick: context.cancel }, 'Cancel'),
            h('button', { class: 'slot-primary', onClick: context.primaryAction }, 'Confirm'),
          ],
        },
      });

      (document.querySelector('.slot-primary') as HTMLElement).click();

      expect(wrapper.emitted('primary-action')).toHaveLength(1);
      expect(wrapper.emitted('close')).toBeUndefined();

      (document.querySelector('.slot-close') as HTMLElement).click();

      expect(wrapper.emitted('close')).toHaveLength(1);
      expect(wrapper.emitted('cancel')).toBeUndefined();

      (document.querySelector('.slot-cancel') as HTMLElement).click();

      expect(wrapper.emitted('cancel')).toHaveLength(1);
      expect(wrapper.emitted('close')).toHaveLength(2);

      wrapper.unmount();
    });
  });

  describe('slot forwarding', () => {
    it.each([
      ['title'],
      ['default'],
      ['actions'],
      ['primary-action'],
    ])('should forward the %s slot through to the dialog', (slotName) => {
      const wrapper = mountModal({ slots: { [slotName]: '<i class="forwarded">forwarded</i>' } });

      expect(dialog().querySelector('.forwarded')).toBeTruthy();

      wrapper.unmount();
    });

    it('should forward only the slots the consumer gave, so the dialog keeps its own defaults', () => {
      const wrapper = mountModal({ slots: { 'primary-action': '<button class="confirm">Delete</button>' } });

      expect(document.querySelector('[data-testid="rc-modal-cancel"]')).toBeTruthy();
      expect(document.querySelector('.confirm')).toBeTruthy();

      wrapper.unmount();
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
