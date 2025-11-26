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

  describe('a11y: adding ARIA props', () => {
    const ariaLabelVal = 'some-aria-label';
    const subLabelVal = 'some-sublabel';
    const ariaDescribedByIdVal = 'some-external-id';
    const ariaRequiredVal = 'true';

    it.each([
      ['text', 'input', ariaLabelVal, subLabelVal, ariaDescribedByIdVal],
      ['cron', 'input', ariaLabelVal, subLabelVal, ariaDescribedByIdVal],
      ['multiline', 'textarea', ariaLabelVal, subLabelVal, ariaDescribedByIdVal],
      ['multiline-password', 'textarea', ariaLabelVal, subLabelVal, ariaDescribedByIdVal],
    ])('for type %p should correctly fill out the appropriate fields on the component', (type, validationType, ariaLabel, subLabel, ariaDescribedById) => {
      const wrapper = mount(LabeledInput, {
        propsData: {
          value: '', type, ariaLabel, subLabel, required: true, mode: 'view'
        },
        attrs: { 'aria-describedby': ariaDescribedById },
        mocks: { $store: { getters: { 'i18n/t': jest.fn() } } }
      });

      const field = wrapper.find(validationType);
      const ariaLabelProp = field.attributes('aria-label');
      const ariaDescribedBy = field.attributes('aria-describedby');
      const ariaRequired = field.attributes('aria-required');
      const ariaDisabled = field.attributes('aria-disabled');
      const disabledAttr = field.attributes('disabled');

      // validates type of input rendered
      expect(field.exists()).toBe(true);
      expect(ariaLabelProp).toBe(ariaLabel);
      expect(ariaDescribedBy).toBe(`${ ariaDescribedById } ${ wrapper.vm.describedById }`);
      expect(ariaRequired).toBe(ariaRequiredVal);
      expect(ariaDisabled).toBe('true');
      expect(disabledAttr).toBeDefined();
    });
  });

  it('a11y: rendering a "label" should not render an "aria-label" prop', () => {
    const label = 'some-label';

    const wrapper = mount(LabeledInput, {
      propsData: { type: 'text', label },
      mocks:     { $store: { getters: { 'i18n/t': jest.fn() } } }
    });

    const mainInput = wrapper.find('input[type="text"]');

    expect(mainInput.attributes('aria-label')).toBeUndefined();
    expect(wrapper.find('label').text()).toBe(label);
  });
});
