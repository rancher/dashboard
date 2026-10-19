import { flushPromises, mount } from '@vue/test-utils';
import RcFieldValidation from './RcFieldValidation.vue';

const LONG = 'The name must be unique within the namespace and may contain only lowercase letters, numbers and hyphens';

// jsdom does no layout, so each test sets how wide the message measures
let scrollWidth: jest.SpyInstance;
let clientWidth: jest.SpyInstance;

const measureAs = (widths: { scrollWidth: number, clientWidth: number }) => {
  scrollWidth.mockReturnValue(widths.scrollWidth);
  clientWidth.mockReturnValue(widths.clientWidth);
};

const mountValidation = (props: Record<string, unknown> = {}) => mount(RcFieldValidation, {
  props: {
    id: 'name-validation', message: LONG, status: 'error', ...props
  }
});

describe('component: RcFieldValidation', () => {
  beforeEach(() => {
    scrollWidth = jest.spyOn(HTMLElement.prototype, 'scrollWidth', 'get');
    clientWidth = jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get');
  });

  it('puts the id on the message text alone', () => {
    measureAs({ scrollWidth: 100, clientWidth: 100 });
    const wrapper = mountValidation();

    expect(wrapper.find('#name-validation').text()).toStrictEqual(LONG);
  });

  it.each([
    ['error', 'icon-error'],
    ['warning', 'icon-warning'],
    ['success', 'icon-checkmark'],
    ['info', 'icon-info'],
  ])('gives the %s status its icon and color', (status, icon) => {
    measureAs({ scrollWidth: 100, clientWidth: 100 });
    const wrapper = mountValidation({ status });

    expect(wrapper.classes()).toContain(`rc-field-validation-${ status }`);
    expect(wrapper.find('.rc-field-validation-icon').classes()).toContain(icon);
  });

  it('offers no toggle while the message fits', () => {
    measureAs({ scrollWidth: 100, clientWidth: 100 });
    const wrapper = mountValidation();

    expect(wrapper.find('.rc-field-validation-toggle').exists()).toBe(false);
  });

  it('ignores a sub-pixel difference', () => {
    measureAs({ scrollWidth: 101, clientWidth: 100 });
    const wrapper = mountValidation();

    expect(wrapper.find('.rc-field-validation-toggle').exists()).toBe(false);
  });

  describe('a message too long for its line', () => {
    beforeEach(() => measureAs({ scrollWidth: 600, clientWidth: 300 }));

    it('offers to show more', async() => {
      const wrapper = mountValidation();

      await wrapper.vm.$nextTick();
      const toggle = wrapper.find('.rc-field-validation-toggle');

      expect(toggle.text()).toStrictEqual('%component.rcField.showMore%');
      expect(toggle.attributes('aria-expanded')).toStrictEqual('false');
      expect(toggle.attributes('aria-controls')).toStrictEqual('name-validation');
    });

    it('expands in place', async() => {
      const wrapper = mountValidation();

      await wrapper.vm.$nextTick();
      await wrapper.find('.rc-field-validation-toggle').trigger('click');

      expect(wrapper.classes()).toContain('expanded');
      expect(wrapper.find('.rc-field-validation-toggle').text()).toStrictEqual('%component.rcField.showLess%');
      expect(wrapper.find('.rc-field-validation-toggle').attributes('aria-expanded')).toStrictEqual('true');
    });

    it('collapses again', async() => {
      const wrapper = mountValidation();

      await wrapper.vm.$nextTick();
      await wrapper.find('.rc-field-validation-toggle').trigger('click');
      await wrapper.find('.rc-field-validation-toggle').trigger('click');

      expect(wrapper.classes()).not.toContain('expanded');
      expect(wrapper.find('.rc-field-validation-toggle').text()).toStrictEqual('%component.rcField.showMore%');
    });

    it('collapses when the message changes', async() => {
      const wrapper = mountValidation();

      await wrapper.vm.$nextTick();
      await wrapper.find('.rc-field-validation-toggle').trigger('click');
      await wrapper.setProps({ message: `${ LONG }, and start with a letter` });

      expect(wrapper.classes()).not.toContain('expanded');
    });

    it('drops the toggle when a new message fits', async() => {
      const wrapper = mountValidation();

      await wrapper.vm.$nextTick();
      measureAs({ scrollWidth: 100, clientWidth: 300 });
      await wrapper.setProps({ message: 'Required' });
      await flushPromises();

      expect(wrapper.find('.rc-field-validation-toggle').exists()).toBe(false);
    });
  });
});
