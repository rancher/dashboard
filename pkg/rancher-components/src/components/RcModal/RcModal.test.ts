import { mount } from '@vue/test-utils';
import { h, ref } from 'vue';
import RcModal from './RcModal.vue';

// jest.setup stubs ResizeObserver away for every suite, because jsdom has none.
// The scrolling body needs more than a stub: it needs to be told when a resize
// happened and what the boxes measure, since jsdom reports every box as zero.
const observerCallbacks: (() => void)[] = [];
const disconnect = jest.fn();

// Say what the body's boxes measure, then let the observer report it.
const resizeBodyTo = async(wrapper: { find: (s: string) => { element: Element } }, { scrollHeight, clientHeight }: { scrollHeight: number, clientHeight: number }) => {
  const body = wrapper.find('[data-testid="rc-modal-body"]').element;

  Object.defineProperty(body, 'scrollHeight', { value: scrollHeight, configurable: true });
  Object.defineProperty(body, 'clientHeight', { value: clientHeight, configurable: true });

  observerCallbacks.forEach((callback) => callback());

  await Promise.resolve();
};

describe('component: RcModal', () => {
  const mountModal = (options = {}) => mount(RcModal, options);

  beforeEach(() => {
    observerCallbacks.length = 0;
    disconnect.mockClear();

    window.ResizeObserver = jest.fn().mockImplementation((callback: () => void) => {
      observerCallbacks.push(callback);

      return {
        observe: jest.fn(), unobserve: jest.fn(), disconnect
      };
    });
  });

  describe('header', () => {
    it('renders the title prop in the header', () => {
      const wrapper = mountModal({ props: { title: 'Move to a new project?' } });

      expect(wrapper.find('[data-testid="rc-modal-title"]').text()).toBe('Move to a new project?');
    });

    it('prefers the title slot over the title prop', () => {
      const wrapper = mountModal({
        props: { title: 'From the prop' },
        slots: { title: '<span>From the slot</span>' }
      });

      expect(wrapper.find('[data-testid="rc-modal-title"]').text()).toBe('From the slot');
    });

    it('omits the header, and its rule, when there is no title at all', () => {
      const wrapper = mountModal({ slots: { default: '<p>Body</p>' } });

      expect(wrapper.find('[data-testid="rc-modal-header"]').exists()).toBe(false);
      expect(wrapper.findAll('hr')).toHaveLength(0);
    });

    it('renders the header, and one rule beneath it, when there is a title', () => {
      const wrapper = mountModal({ props: { title: 'Are you sure?' } });

      expect(wrapper.find('[data-testid="rc-modal-header"]').exists()).toBe(true);
      expect(wrapper.findAll('hr')).toHaveLength(1);
    });
  });

  describe('body', () => {
    it('renders the default slot as the body', () => {
      const wrapper = mountModal({ slots: { default: '<p class="content">Body content</p>' } });

      expect(wrapper.find('[data-testid="rc-modal-body"] p.content').text()).toBe('Body content');
    });

    it('renders the body even when it is empty, so the chrome keeps its shape', () => {
      const wrapper = mountModal({ props: { title: 'Title only' } });

      expect(wrapper.find('[data-testid="rc-modal-body"]').exists()).toBe(true);
    });
  });

  describe('actions', () => {
    it('renders the actions slot in the footer', () => {
      const wrapper = mountModal({ slots: { actions: '<button>Cancel</button><button>Delete</button>' } });

      expect(wrapper.findAll('[data-testid="rc-modal-actions"] button')).toHaveLength(2);
    });

    it('omits the footer, and its rule, when there are no actions', () => {
      const wrapper = mountModal({ props: { title: 'Are you sure?' } });

      expect(wrapper.find('[data-testid="rc-modal-actions"]').exists()).toBe(false);
      expect(wrapper.findAll('hr')).toHaveLength(1);
    });

    it('renders a rule above the footer as well as below the header', () => {
      const wrapper = mountModal({
        props: { title: 'Are you sure?' },
        slots: { actions: '<button>Delete</button>' }
      });

      expect(wrapper.findAll('hr')).toHaveLength(2);
    });

    it('shows the footer when the actions slot only appears later', async() => {
      const show = ref(false);
      const wrapper = mount({
        setup() {
          return () => h(RcModal, { title: 'Are you sure?' }, show.value ? { actions: () => h('button', 'Delete') } : {});
        }
      });

      expect(wrapper.find('[data-testid="rc-modal-actions"]').exists()).toBe(false);

      show.value = true;
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="rc-modal-actions"]').exists()).toBe(true);
    });

    it('renders a rule above the footer even when there is no header', () => {
      const wrapper = mountModal({ slots: { actions: '<button>Delete</button>' } });

      expect(wrapper.findAll('hr')).toHaveLength(1);
      expect(wrapper.find('[data-testid="rc-modal-actions"]').exists()).toBe(true);
    });
  });

  describe('accessible name', () => {
    // RcModal sits inside the host's role="dialog" element, so it is mounted
    // into one here the way AppModal and PromptModal both provide it.
    // The name is claimed in a post-flush watcher, so it lands on the tick
    // after mount rather than during it.
    const mountInDialog = async(props = {}, attrs: Record<string, string> = {}, role = 'dialog') => {
      const dialog = document.createElement('div');

      dialog.setAttribute('role', role);
      Object.entries(attrs).forEach(([k, v]) => dialog.setAttribute(k, v));
      document.body.appendChild(dialog);

      const wrapper = mount(RcModal, { props, attachTo: dialog });

      await wrapper.vm.$nextTick();

      return { dialog, wrapper };
    };

    it('names the surrounding dialog with its own title', async() => {
      const { dialog, wrapper } = await mountInDialog({ title: 'Are you sure?' });
      const titleId = wrapper.find('[data-testid="rc-modal-title"]').attributes('id');

      expect(dialog.getAttribute('aria-labelledby')).toBe(titleId);

      wrapper.unmount();
    });

    it('leaves a dialog the host has already named alone', async() => {
      const { dialog, wrapper } = await mountInDialog({ title: 'Are you sure?' }, { 'aria-labelledby': 'host-owned-title' });

      expect(dialog.getAttribute('aria-labelledby')).toBe('host-owned-title');

      wrapper.unmount();
    });

    it('gives up the name again when it unmounts, so a later modal can claim it', async() => {
      const { dialog, wrapper } = await mountInDialog({ title: 'Are you sure?' });

      wrapper.unmount();

      expect(dialog.getAttribute('aria-labelledby')).toBeNull();
    });

    it('does not name the dialog when there is no title to name it with', async() => {
      const { dialog, wrapper } = await mountInDialog({});

      expect(dialog.getAttribute('aria-labelledby')).toBeNull();

      wrapper.unmount();
    });

    it('names the dialog when the title only arrives later', async() => {
      const dialog = document.createElement('div');

      dialog.setAttribute('role', 'dialog');
      document.body.appendChild(dialog);

      const title = ref('');
      const wrapper = mount({
        setup() {
          return () => h(RcModal, { title: title.value });
        }
      }, { attachTo: dialog });

      expect(dialog.getAttribute('aria-labelledby')).toBeNull();

      title.value = 'Loaded from a fetch';
      await wrapper.vm.$nextTick();

      const titleId = wrapper.find('[data-testid="rc-modal-title"]').attributes('id');

      expect(titleId).toBeTruthy();
      expect(dialog.getAttribute('aria-labelledby')).toBe(titleId);

      wrapper.unmount();
    });

    it('re-points the dialog when the titleId changes', async() => {
      const dialog = document.createElement('div');

      dialog.setAttribute('role', 'dialog');
      document.body.appendChild(dialog);

      const titleId = ref('first-id');
      const wrapper = mount({
        setup() {
          return () => h(RcModal, { title: 'Are you sure?', titleId: titleId.value });
        }
      }, { attachTo: dialog });

      await wrapper.vm.$nextTick();

      expect(dialog.getAttribute('aria-labelledby')).toBe('first-id');

      titleId.value = 'second-id';
      await wrapper.vm.$nextTick();

      expect(dialog.getAttribute('aria-labelledby')).toBe('second-id');

      wrapper.unmount();
    });

    it('names an alertdialog too, which a destructive confirm carries instead', async() => {
      const { dialog, wrapper } = await mountInDialog({ title: 'Are you sure?' }, {}, 'alertdialog');
      const titleId = wrapper.find('[data-testid="rc-modal-title"]').attributes('id');

      expect(dialog.getAttribute('aria-labelledby')).toBe(titleId);

      wrapper.unmount();
    });

    it('leaves a name the host set after mount alone when it unmounts', async() => {
      const { dialog, wrapper } = await mountInDialog({ title: 'Are you sure?' });

      dialog.setAttribute('aria-labelledby', 'set-by-the-host-later');
      wrapper.unmount();

      expect(dialog.getAttribute('aria-labelledby')).toBe('set-by-the-host-later');
    });

    it('puts the given titleId on the title, so a host can reference it directly', () => {
      const wrapper = mountModal({ props: { title: 'Are you sure?', titleId: 'prompt-remove-title' } });

      expect(wrapper.find('[data-testid="rc-modal-title"]').attributes('id')).toBe('prompt-remove-title');
    });

    it('generates a title id when none is given', () => {
      const wrapper = mountModal({ props: { title: 'Are you sure?' } });

      expect(wrapper.find('[data-testid="rc-modal-title"]').attributes('id')).toBeTruthy();
    });

    it('gives two modals in the same app different generated title ids', () => {
      const wrapper = mount({
        components: { RcModal },
        template:   '<div><RcModal title="First" /><RcModal title="Second" /></div>'
      });

      const ids = wrapper.findAll('[data-testid="rc-modal-title"]').map((el) => el.attributes('id'));

      expect(ids).toHaveLength(2);
      expect(ids[0]).not.toBe(ids[1]);
    });
  });

  // A body taller than the space it has is only readable with a mouse unless
  // something can put keyboard focus in it. Chromium will not, because the body
  // usually holds focusable content, and the modal's focus trap tabs by
  // tabindex, so the attribute has to be there while there is overflow.
  describe('scrolling body', () => {
    it('is not a tab stop while its content fits', async() => {
      const wrapper = mountModal({ props: { title: 'Short' }, slots: { default: '<p>Body</p>' } });

      await resizeBodyTo(wrapper, { scrollHeight: 200, clientHeight: 200 });

      expect(wrapper.find('[data-testid="rc-modal-body"]').attributes('tabindex')).toBeUndefined();
    });

    it('becomes a tab stop once its content overflows', async() => {
      const wrapper = mountModal({ props: { title: 'Tall' }, slots: { default: '<p>Body</p>' } });

      await resizeBodyTo(wrapper, { scrollHeight: 1000, clientHeight: 400 });

      expect(wrapper.find('[data-testid="rc-modal-body"]').attributes('tabindex')).toBe('0');
    });

    it('stops being a tab stop when the overflow goes away', async() => {
      const wrapper = mountModal({ props: { title: 'Tall' }, slots: { default: '<p>Body</p>' } });

      await resizeBodyTo(wrapper, { scrollHeight: 1000, clientHeight: 400 });
      await resizeBodyTo(wrapper, { scrollHeight: 400, clientHeight: 400 });

      expect(wrapper.find('[data-testid="rc-modal-body"]').attributes('tabindex')).toBeUndefined();
    });

    it('ignores a sub-pixel difference, which nobody can scroll to', async() => {
      const wrapper = mountModal({ props: { title: 'Tall' }, slots: { default: '<p>Body</p>' } });

      await resizeBodyTo(wrapper, { scrollHeight: 400.5, clientHeight: 400 });

      expect(wrapper.find('[data-testid="rc-modal-body"]').attributes('tabindex')).toBeUndefined();
    });

    it('stops observing when it unmounts', async() => {
      const wrapper = mountModal({ props: { title: 'Tall' } });

      await resizeBodyTo(wrapper, { scrollHeight: 1000, clientHeight: 400 });

      wrapper.unmount();

      expect(disconnect).toHaveBeenCalledWith();
    });
  });
});
