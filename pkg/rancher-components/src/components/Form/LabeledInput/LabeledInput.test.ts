import { defineComponent, nextTick } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { useForm } from 'vee-validate';
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

  describe('vee-validate integration', () => {
    const i18nMock = { $store: { getters: { 'i18n/t': jest.fn() } } };

    it('without name prop: existing rules-based validation message is shown after blur', async() => {
      const errorMessage = 'This field cannot be empty';
      const notEmptyRule = (v: string) => (!v ? errorMessage : undefined);

      const wrapper = mount(LabeledInput, {
        propsData: {
          rules: [notEmptyRule],
          value: '',
        },
        mocks: i18nMock
      });

      await wrapper.find('input').trigger('blur');
      await nextTick();

      expect(wrapper.vm.validationMessage).toBe(errorMessage);
    });

    it('without name prop: error CSS class is not applied automatically', async() => {
      const notEmptyRule = (v: string) => (!v ? 'Error' : undefined);

      const wrapper = mount(LabeledInput, {
        propsData: {
          rules: [notEmptyRule],
          value: '',
        },
        mocks: i18nMock
      });

      await wrapper.find('input').trigger('blur');
      await nextTick();

      expect(wrapper.find('.labeled-input').classes()).not.toContain('error');
    });

    it('with name prop: name attribute is set on the input element', () => {
      const wrapper = mount(LabeledInput, {
        propsData: { name: 'myField' },
        mocks:     i18nMock
      });

      expect(wrapper.find('input').attributes('name')).toStrictEqual('myField');
    });

    it('with name prop: existing rules run through vee-validate and show error message after blur', async() => {
      const errorMessage = 'Field cannot be empty';
      const notEmptyRule = (v: string) => (!v ? errorMessage : undefined);

      const wrapper = mount(LabeledInput, {
        propsData: {
          name:  'testField',
          rules: [notEmptyRule],
          value: '',
        },
        mocks: i18nMock
      });

      await wrapper.find('input').trigger('blur');
      await flushPromises();

      expect(wrapper.vm.validationMessage).toStrictEqual(errorMessage);
    });

    it('with name prop: no error class when validation passes', async() => {
      const notEmptyRule = (v: string) => (!v ? 'Error' : undefined);

      const wrapper = mount(LabeledInput, {
        propsData: {
          name:  'testField',
          rules: [notEmptyRule],
          value: 'valid value',
        },
        mocks: i18nMock
      });

      await wrapper.find('input').trigger('blur');
      await flushPromises();

      expect(wrapper.find('.labeled-input').classes()).not.toContain('error');
      expect(wrapper.vm.validationMessage).toBeUndefined();
    });

    it('with name prop: form-level validation schema error is shown when the form validates', async() => {
      const errorMessage = 'Username is required';
      let triggerFormValidation!: () => Promise<unknown>;

      const TestWrapper = defineComponent({
        components: { LabeledInput },
        setup() {
          const { validate } = useForm({
            validationSchema: { username: (v: string) => (!v ? errorMessage : true) },
            initialValues:    { username: '' }
          });

          triggerFormValidation = validate;

          return {};
        },
        template: '<LabeledInput name="username" value="" />'
      });

      const wrapper = mount(TestWrapper, { global: { mocks: { $store: { getters: { 'i18n/t': jest.fn() } } } } });

      await triggerFormValidation();
      await flushPromises();

      const labeledInput = wrapper.findComponent(LabeledInput);

      expect(labeledInput.vm.validationMessage).toStrictEqual(errorMessage);
    });

    it('without name prop: error clears when a previously invalid value becomes valid', async() => {
      const errorMessage = 'This field cannot be empty';
      const notEmptyRule = (v: string) => (!v ? errorMessage : undefined);

      const wrapper = mount(LabeledInput, {
        propsData: {
          rules: [notEmptyRule],
          value: '',
        },
        mocks: i18nMock
      });

      await wrapper.find('input').trigger('blur');
      await nextTick();

      expect(wrapper.vm.validationMessage).toBe(errorMessage);

      await wrapper.setProps({ value: 'valid value' });
      await nextTick();

      expect(wrapper.vm.validationMessage).toBeUndefined();
    });

    it('with name prop: error clears when a previously invalid value becomes valid', async() => {
      const errorMessage = 'Field cannot be empty';
      const notEmptyRule = (v: string) => (!v ? errorMessage : undefined);

      const wrapper = mount(LabeledInput, {
        propsData: {
          name:  'testField',
          rules: [notEmptyRule],
          value: '',
        },
        mocks: i18nMock
      });

      await wrapper.find('input').trigger('blur');
      await flushPromises();

      expect(wrapper.vm.validationMessage).toStrictEqual(errorMessage);

      await wrapper.setProps({ value: 'valid value' });
      await flushPromises();

      expect(wrapper.vm.validationMessage).toBeUndefined();
    });

    describe('with both name and rules provided', () => {
      it('shows the error message exactly once when invalid (not duplicated across both validation paths)', async() => {
        const errorMessage = 'Field cannot be empty';
        const notEmptyRule = (v: string) => (!v ? errorMessage : undefined);

        const wrapper = mount(LabeledInput, {
          propsData: {
            name:  'testField',
            rules: [notEmptyRule],
            value: '',
          },
          mocks: i18nMock
        });

        await wrapper.find('input').trigger('blur');
        await flushPromises();

        expect(wrapper.vm.validationMessage).toStrictEqual(errorMessage);
        expect(wrapper.vm.validationMessage).not.toContain(`${ errorMessage }, ${ errorMessage }`);
      });

      it('shows no error when the value satisfies the rules', async() => {
        const notEmptyRule = (v: string) => (!v ? 'Field cannot be empty' : undefined);

        const wrapper = mount(LabeledInput, {
          propsData: {
            name:  'testField',
            rules: [notEmptyRule],
            value: 'valid value',
          },
          mocks: i18nMock
        });

        await wrapper.find('input').trigger('blur');
        await flushPromises();

        expect(wrapper.vm.validationMessage).toBeUndefined();
      });
    });
  });
});
