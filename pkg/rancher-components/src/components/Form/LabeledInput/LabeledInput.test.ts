import { mount } from '@vue/test-utils';
import { LabeledInput } from './index';

describe('component: LabeledInput', () => {
  it('should emit input only once', () => {
    const value = '2';
    const delay = 1;
    const wrapper = mount(LabeledInput, {
      propsData: { delay },
      mocks:     { $store: { getters: { 'i18n/t': jest.fn() } } }
    });

    jest.useFakeTimers();
    wrapper.find('input').setValue('1');
    wrapper.find('input').setValue(value);
    jest.advanceTimersByTime(delay);
    jest.useRealTimers();

    expect(wrapper.emitted('update:value')).toHaveLength(1);
    expect(wrapper.emitted('update:value')![0][0]).toBe(value);
  });

  it('using type "multiline" should emit input value correctly', () => {
    const value = 'any-string';
    const delay = 1;
    const wrapper = mount(LabeledInput, {
      propsData: { delay, multiline: true },
      mocks:     { $store: { getters: { 'i18n/t': jest.fn() } } }
    });

    jest.useFakeTimers();
    wrapper.find('input').setValue('1');
    wrapper.find('input').setValue(value);
    jest.advanceTimersByTime(delay);
    jest.useRealTimers();

    expect(wrapper.emitted('update:value')).toHaveLength(1);
    expect(wrapper.emitted('update:value')![0][0]).toBe(value);
  });

  describe('using type "chron"', () => {
    it.each([
      ['0 * * * *', 'Every hour, every day'],
      ['@daily', 'At 12:00 AM, every day'],
      ['You must fail! Go!', '%generic.invalidCron%'],
    ])('passing value %p should display hint %p', (value, hint) => {
      const wrapper = mount(LabeledInput, {
        propsData: { value, type: 'cron' },
        mocks:     { $store: { getters: { 'i18n/t': jest.fn() } } }
      });

      const subLabel = wrapper.find('[data-testid="sub-label"]');

      expect(subLabel.text()).toBe(hint);
    });
  });
});
