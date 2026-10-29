import { flushPromises, mount } from '@vue/test-utils';
import RcFieldValidation from './RcFieldValidation.vue';

const LONG = 'The name must be unique within the namespace and may contain only lowercase letters, numbers and hyphens';

// jsdom does no layout, so each test sets how tall the clamped message measures
let scrollHeight: jest.SpyInstance;
let clientHeight: jest.SpyInstance;

const measureAs = (heights: { scrollHeight: number, clientHeight: number }) => {
  scrollHeight.mockReturnValue(heights.scrollHeight);
  clientHeight.mockReturnValue(heights.clientHeight);
};

const FITS = { scrollHeight: 36, clientHeight: 36 };
const OVERFLOWS = { scrollHeight: 72, clientHeight: 36 };

const mountValidation = (props: Record<string, unknown> = {}, options: { attachTo?: HTMLElement } = {}) => mount(RcFieldValidation, {
  ...options,
  props: {
    id: 'name-validation', message: LONG, status: 'error', ...props
  }
});

describe('component: RcFieldValidation', () => {
  beforeEach(() => {
    scrollHeight = jest.spyOn(HTMLElement.prototype, 'scrollHeight', 'get');
    clientHeight = jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get');
  });

  it('puts the id on the status and message text', () => {
    measureAs(FITS);
    const wrapper = mountValidation();

    expect(wrapper.find('#name-validation').text()).toStrictEqual(`%component.rcField.status.error% ${ LONG }`);
  });

  it.each(['error', 'warning', 'success', 'info'])('names the %s status for screen readers', (status) => {
    measureAs(FITS);
    const wrapper = mountValidation({ status });

    expect(wrapper.find('.rc-field-validation-status').text()).toStrictEqual(`%component.rcField.status.${ status }%`);
  });

  it.each([
    ['error', 'icon-error'],
    ['warning', 'icon-warning'],
    ['success', 'icon-checkmark'],
    ['info', 'icon-info'],
  ])('gives the %s status its icon and color', (status, icon) => {
    measureAs(FITS);
    const wrapper = mountValidation({ status });

    expect(wrapper.classes()).toContain(`rc-field-validation-${ status }`);
    expect(wrapper.find('.rc-field-validation-icon').classes()).toContain(icon);
  });

  it('offers no toggle or summary while the message fits in two lines', () => {
    measureAs(FITS);
    const wrapper = mountValidation();

    expect(wrapper.classes()).not.toContain('truncated');
    expect(wrapper.find('.rc-field-validation-summary').exists()).toBe(false);
  });

  it('ignores a sub-pixel difference', () => {
    measureAs({ scrollHeight: 37, clientHeight: 36 });
    const wrapper = mountValidation();

    expect(wrapper.find('.rc-field-validation-toggle').exists()).toBe(false);
  });

  describe('a message too long for two lines', () => {
    beforeEach(() => measureAs(OVERFLOWS));

    const mountTruncated = async() => {
      const wrapper = mountValidation({}, { attachTo: document.body });

      await wrapper.vm.$nextTick();

      return wrapper;
    };

    const openPopover = async(wrapper: Awaited<ReturnType<typeof mountTruncated>>) => {
      await wrapper.find('.rc-field-validation-toggle').trigger('click');
      await flushPromises();

      return document.getElementById('name-validation-popover') as HTMLElement;
    };

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it.each(['error', 'warning', 'success', 'info'])('shows the %s summary in place of the message', async(status) => {
      const wrapper = mountValidation({ status });

      await wrapper.vm.$nextTick();
      const summary = wrapper.find('#name-validation-summary');

      expect(wrapper.classes()).toContain('truncated');
      expect(summary.text()).toStrictEqual(`%component.rcField.summary.${ status }%`);
      expect(summary.attributes('aria-hidden')).toStrictEqual('true');
    });

    it('keeps the full message in the text the control is described by', async() => {
      const wrapper = await mountTruncated();

      expect(wrapper.find('#name-validation').text()).toStrictEqual(`%component.rcField.status.error% ${ LONG }`);
      wrapper.unmount();
    });

    it('offers to show more in a dialog', async() => {
      const wrapper = await mountTruncated();
      const toggle = wrapper.find('.rc-field-validation-toggle');

      expect(toggle.text()).toStrictEqual('%component.rcField.showMore%');
      expect(toggle.attributes('aria-haspopup')).toStrictEqual('dialog');
      expect(toggle.attributes('aria-expanded')).toStrictEqual('false');
      expect(toggle.attributes('aria-controls')).toBeUndefined();
      wrapper.unmount();
    });

    it('opens the full message in a dialog named by the summary', async() => {
      const wrapper = await mountTruncated();
      const popover = await openPopover(wrapper);
      const toggle = wrapper.find('.rc-field-validation-toggle');

      expect(popover.getAttribute('role')).toStrictEqual('dialog');
      expect(popover.getAttribute('aria-labelledby')).toStrictEqual('name-validation-summary');
      expect(popover.textContent?.trim()).toStrictEqual(LONG);
      expect(toggle.attributes('aria-expanded')).toStrictEqual('true');
      expect(toggle.attributes('aria-controls')).toStrictEqual('name-validation-popover');
      wrapper.unmount();
    });

    it.each(['Escape', 'Tab'])('closes on %s and returns focus to the toggle', async(key) => {
      const wrapper = await mountTruncated();
      const popover = await openPopover(wrapper);

      popover.focus();
      popover.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      await flushPromises();

      const toggle = wrapper.find('.rc-field-validation-toggle');

      expect(toggle.attributes('aria-expanded')).toStrictEqual('false');
      expect(document.activeElement).toBe(toggle.element);
      wrapper.unmount();
    });

    it('closes when the focus leaves the dialog', async() => {
      const wrapper = await mountTruncated();
      const popover = await openPopover(wrapper);

      popover.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
      await flushPromises();

      expect(wrapper.find('.rc-field-validation-toggle').attributes('aria-expanded')).toStrictEqual('false');
      wrapper.unmount();
    });

    it('closes again from the toggle', async() => {
      const wrapper = await mountTruncated();

      await openPopover(wrapper);
      await wrapper.find('.rc-field-validation-toggle').trigger('click');

      expect(wrapper.find('.rc-field-validation-toggle').attributes('aria-expanded')).toStrictEqual('false');
      wrapper.unmount();
    });

    it('closes when the message changes', async() => {
      const wrapper = await mountTruncated();

      await openPopover(wrapper);
      await wrapper.setProps({ message: `${ LONG }, and start with a letter` });

      expect(wrapper.find('.rc-field-validation-toggle').attributes('aria-expanded')).toStrictEqual('false');
      wrapper.unmount();
    });

    it('drops the summary when a new message fits', async() => {
      const wrapper = await mountTruncated();

      measureAs(FITS);
      await wrapper.setProps({ message: 'Required' });
      await flushPromises();

      expect(wrapper.find('.rc-field-validation-summary').exists()).toBe(false);
      wrapper.unmount();
    });
  });
});
