import { defineComponent, nextTick, provide, ref } from 'vue';
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
    const [[emitted]] = wrapper.emitted('update:value') as [string][];

    expect(emitted).toBe(value);
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
    const [[emitted]] = wrapper.emitted('update:value') as [string][];

    expect(emitted).toBe(value);
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

  describe('type "integer"', () => {
    const i18nMock = { $store: { getters: { 'i18n/t': jest.fn() } } };

    it('should render a text input with numeric inputmode', () => {
      const wrapper = mount(LabeledInput, {
        propsData: { type: 'integer', value: '' },
        mocks:     i18nMock
      });
      const input = wrapper.find('input');

      expect(input.attributes('type')).toBe('text');
      expect(input.attributes('inputmode')).toBe('numeric');
    });

    it.each([
      'e', 'E', '.', '+',
    ])('should prevent non-integer key "%s"', (key) => {
      const wrapper = mount(LabeledInput, {
        propsData: { type: 'integer', value: '' },
        mocks:     i18nMock
      });
      const input = wrapper.find('input');
      const event = new KeyboardEvent('keydown', { key, cancelable: true });

      input.element.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    });

    it.each([
      '0', '1', '9', '-', 'Backspace', 'Tab', 'ArrowLeft',
    ])('should allow key "%s"', (key) => {
      const wrapper = mount(LabeledInput, {
        propsData: { type: 'integer', value: '' },
        mocks:     i18nMock
      });
      const input = wrapper.find('input');
      const event = new KeyboardEvent('keydown', { key, cancelable: true });

      input.element.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(false);
    });

    it('should also block "-" when min="0"', () => {
      const wrapper = mount(LabeledInput, {
        propsData: { type: 'integer', value: '' },
        attrs:     { min: '0' },
        mocks:     i18nMock
      });
      const input = wrapper.find('input');
      const event = new KeyboardEvent('keydown', { key: '-', cancelable: true });

      input.element.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    });

    function createPasteEvent(text: string): Event {
      const event = new Event('paste', { cancelable: true });

      (event as Event & { clipboardData: Pick<DataTransfer, 'getData'> }).clipboardData = { getData: () => text };

      return event;
    }

    it.each([
      '123',
      '-5',
    ])('should allow pasting valid integer "%s"', (text) => {
      const wrapper = mount(LabeledInput, {
        propsData: { type: 'integer', value: '' },
        mocks:     i18nMock
      });
      const input = wrapper.find('input');
      const event = createPasteEvent(text);

      input.element.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(false);
    });

    it.each([
      '-e10',
      '1.5',
      '12abc',
      '1e5',
    ])('should block pasting invalid integer "%s"', (text) => {
      const wrapper = mount(LabeledInput, {
        propsData: { type: 'integer', value: '' },
        mocks:     i18nMock
      });
      const input = wrapper.find('input');
      const event = createPasteEvent(text);

      input.element.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    });

    it('should block pasting negative integer when min="0"', () => {
      const wrapper = mount(LabeledInput, {
        propsData: { type: 'integer', value: '' },
        attrs:     { min: '0' },
        mocks:     i18nMock
      });
      const input = wrapper.find('input');
      const event = createPasteEvent('-5');

      input.element.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
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

  // The native input used to carry role="textbox" for every type but "number".
  // On "search" and "password" that role is disallowed outright, and on
  // "search" it also hid the implicit searchbox role from assistive
  // technology; on the other types listed below it only repeated the implicit
  // role. Either way the browser already exposes the right one, so the
  // component writes none. "number" is listed because it must keep its
  // implicit spinbutton role, and the "multiline" types are absent because
  // they render a textarea rather than an input.
  describe('a11y: leaving the implicit role alone', () => {
    it.each([
      ['text'],
      ['search'],
      ['password'],
      ['email'],
      ['number'],
      ['integer'],
      ['cron'],
    ])('for type %p should not write an explicit role onto the input', (type) => {
      const wrapper = mount(LabeledInput, {
        propsData: { value: '', type },
        mocks:     { $store: { getters: { 'i18n/t': jest.fn() } } }
      });

      expect(wrapper.find('input').attributes('role')).toBeUndefined();
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

  describe('clear button functionality', () => {
    const i18nMock = { $store: { getters: { 'i18n/t': jest.fn() } } };

    describe('type="search"', () => {
      it('should show clear button when type is search and value is not empty', () => {
        const wrapper = mount(LabeledInput, {
          propsData: { type: 'search', value: 'test query' },
          mocks:     i18nMock
        });

        const clearButton = wrapper.find('.labeled-input-clear-button');

        expect(clearButton.exists()).toBe(true);
      });

      it('should not show clear button when type is search and value is empty', () => {
        const wrapper = mount(LabeledInput, {
          propsData: { type: 'search', value: '' },
          mocks:     i18nMock
        });

        const clearButton = wrapper.find('.labeled-input-clear-button');

        expect(clearButton.exists()).toBe(false);
      });

      it('should hide native search cancel button', () => {
        const wrapper = mount(LabeledInput, {
          propsData: { type: 'search', value: 'test' },
          mocks:     i18nMock
        });
        const input = wrapper.find('input[type="search"]');

        expect(input.exists()).toBe(true);
      });

      it('should clear input value when clear button is clicked', async() => {
        const wrapper = mount(LabeledInput, {
          propsData: { type: 'search', value: 'test query' },
          mocks:     i18nMock
        });

        const clearButton = wrapper.find('.labeled-input-clear-button');

        await clearButton.trigger('click');

        expect(wrapper.emitted('update:value')).toHaveLength(1);
        const [[emitted]] = wrapper.emitted('update:value') as [string][];

        expect(emitted).toBe('');
      });

      it('should clear input value when Enter key is pressed on clear button', async() => {
        const wrapper = mount(LabeledInput, {
          propsData: { type: 'search', value: 'test query' },
          mocks:     i18nMock
        });

        const clearButton = wrapper.find('.labeled-input-clear-button');

        await clearButton.trigger('keydown.enter');

        expect(wrapper.emitted('update:value')).toHaveLength(1);
        const [[emitted]] = wrapper.emitted('update:value') as [string][];

        expect(emitted).toBe('');
      });

      it('should clear input value when Space key is pressed on clear button', async() => {
        const wrapper = mount(LabeledInput, {
          propsData: { type: 'search', value: 'test query' },
          mocks:     i18nMock
        });

        const clearButton = wrapper.find('.labeled-input-clear-button');

        await clearButton.trigger('keydown.space');

        expect(wrapper.emitted('update:value')).toHaveLength(1);
        const [[emitted]] = wrapper.emitted('update:value') as [string][];

        expect(emitted).toBe('');
      });

      it('should have proper ARIA label for accessibility', () => {
        const wrapper = mount(LabeledInput, {
          propsData: { type: 'search', value: 'test query' },
          mocks:     i18nMock
        });

        const clearButton = wrapper.find('.labeled-input-clear-button');

        expect(clearButton.attributes('aria-label')).toBeDefined();
        expect(clearButton.attributes('type')).toBe('button');
      });

      it('should be disabled when input is disabled', () => {
        const wrapper = mount(LabeledInput, {
          propsData: {
            type: 'search', value: 'test query', mode: 'view'
          },
          mocks: i18nMock
        });

        const clearButton = wrapper.find('.labeled-input-clear-button');

        expect(clearButton.attributes('disabled')).toBeDefined();
      });
    });

    describe('clearButtonLabel prop', () => {
      it('should fall back to the generic clear label when no custom label is given', () => {
        const wrapper = mount(LabeledInput, {
          propsData: { type: 'search', value: 'test query' },
          mocks:     i18nMock
        });

        const clearButton = wrapper.find('.labeled-input-clear-button');

        // The i18n helper wraps unresolved keys in `%...%`, so this asserts
        // which translation key was requested
        expect(clearButton.attributes('aria-label')).toBe('%generic.clear%');
      });

      it('should use the custom label when one is given', () => {
        const wrapper = mount(LabeledInput, {
          propsData: {
            type: 'search', value: 'test query', clearButtonLabel: 'Clear Filter for table results'
          },
          mocks: i18nMock
        });

        const clearButton = wrapper.find('.labeled-input-clear-button');

        expect(clearButton.attributes('aria-label')).toBe('Clear Filter for table results');
      });
    });

    describe('showClearButton prop', () => {
      it('should show clear button when showClearButton is true and value is not empty', () => {
        const wrapper = mount(LabeledInput, {
          propsData: {
            type: 'text', value: 'test', showClearButton: true
          },
          mocks: i18nMock
        });

        const clearButton = wrapper.find('.labeled-input-clear-button');

        expect(clearButton.exists()).toBe(true);
      });

      it('should not show clear button when showClearButton is false even for search type', () => {
        const wrapper = mount(LabeledInput, {
          propsData: {
            type: 'search', value: 'test', showClearButton: false
          },
          mocks: i18nMock
        });

        const clearButton = wrapper.find('.labeled-input-clear-button');

        expect(clearButton.exists()).toBe(false);
      });

      it('should not show clear button when showClearButton is true but value is empty', () => {
        const wrapper = mount(LabeledInput, {
          propsData: {
            type: 'text', value: '', showClearButton: true
          },
          mocks: i18nMock
        });

        const clearButton = wrapper.find('.labeled-input-clear-button');

        expect(clearButton.exists()).toBe(false);
      });
    });

    describe('type="text" without showClearButton', () => {
      it('should not show clear button by default for text type', () => {
        const wrapper = mount(LabeledInput, {
          propsData: { type: 'text', value: 'test' },
          mocks:     i18nMock
        });

        const clearButton = wrapper.find('.labeled-input-clear-button');

        expect(clearButton.exists()).toBe(false);
      });
    });
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
      const showAllErrors = ref(false);
      let triggerFormValidation!: () => Promise<unknown>;

      const TestWrapper = defineComponent({
        components: { LabeledInput },
        setup() {
          provide('vee-show-all-errors', showAllErrors);

          const { validate } = useForm({
            validationSchema: { username: (v: string) => (!v ? errorMessage : true) },
            initialValues:    { username: '' },
          });

          triggerFormValidation = async() => {
            await validate();
            showAllErrors.value = true;
          };

          return {};
        },
        template: '<LabeledInput name="username" value="" />',
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
