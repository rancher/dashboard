import { defineComponent, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import RcSection from '@components/RcSection/RcSection.vue';
import { useLabeledFormElement } from './useLabeledFormElement';

describe('useLabeledFormElement', () => {
  it('should set raised to true when focused', () => {
    const props = {
      mode:     'edit',
      value:    '',
      required: true,
      disabled: false,
      rules:    [],
    };

    const emit = jest.fn();
    const { onFocusLabeled, onBlurLabeled, raised } = useLabeledFormElement(props, emit);

    onFocusLabeled();
    expect(raised.value).toBe(true);

    onBlurLabeled();
    expect(raised.value).toBe(false);
  });

  it('should set focused to true when focused', () => {
    const props = {
      mode:     'edit',
      value:    '',
      required: true,
      disabled: false,
      rules:    [],
    };

    const emit = jest.fn();
    const { onFocusLabeled, onBlurLabeled, focused } = useLabeledFormElement(props, emit);

    onFocusLabeled();
    expect(focused.value).toBe(true);

    onBlurLabeled();
    expect(focused.value).toBe(false);
  });

  it('should set blurred to current timestamp when blurred', () => {
    const props = {
      mode:     'edit',
      value:    '',
      required: true,
      disabled: false,
      rules:    [],
    };

    const emit = jest.fn();
    const { onBlurLabeled, blurred } = useLabeledFormElement(props, emit);

    onBlurLabeled();
    expect(blurred.value).toBeTruthy();
  });

  it('should compute isDisabled correctly', () => {
    const props = ref({
      mode:     'edit',
      value:    '',
      required: true,
      disabled: false,
      rules:    [],
    });

    const emit = jest.fn();
    const { isDisabled } = useLabeledFormElement(props.value, emit);

    expect(isDisabled.value).toBe(false);

    props.value.disabled = true;
    expect(isDisabled.value).toBe(true);

    props.value.mode = 'view';
    expect(isDisabled.value).toBe(true);
  });

  it('should compute validationMessage correctly for required field', () => {
    const props = ref({
      mode:     'edit',
      value:    '',
      required: true,
      disabled: false,
      rules:    [
        (value: string[]) => (value.length < 5 ? 'This field is required' : undefined),
      ],
    });

    const emit = jest.fn();
    const { validationMessage, onBlurLabeled } = useLabeledFormElement(props.value, emit);

    onBlurLabeled();
    expect(validationMessage.value).toBe('This field is required');
  });

  it('should compute validationMessage correctly for custom rules', () => {
    const props = ref({
      mode:     'edit',
      value:    'test',
      required: false,
      disabled: false,
      rules:    [
        (value: string[]) => (value.length < 5 ? 'Value must be at least 5 characters long' : undefined),
        (value: string[]) => (value.includes('test') ? 'Value cannot contain the word "test"' : undefined),
      ],
    });

    const emit = jest.fn();
    const { validationMessage, onBlurLabeled } = useLabeledFormElement(props.value, emit);

    onBlurLabeled();
    expect(validationMessage.value).toBe('Value must be at least 5 characters long, Value cannot contain the word "test"');
  });

  it('should compute requiredField correctly', () => {
    const props = ref({
      mode:     'edit',
      value:    '',
      required: true,
      disabled: false,
      rules:    [],
    });

    const emit = jest.fn();
    const { requiredField } = useLabeledFormElement(props.value, emit);

    expect(requiredField.value).toBe(true);

    // When the field is not required, requiredField should be false
    props.value.required = false;
    expect(requiredField.value).toBe(false);
  });

  describe('reporting to a collapsed RcSection', () => {
    const ICON = '[data-testid="rc-section-invalid-fields"]';
    // Named `required`, which the composable treats as the required rule
    const required = (v: unknown) => (v ? undefined : 'Required');

    const mountInSection = async(props: Record<string, unknown>) => {
      const Field = defineComponent({
        setup() {
          useLabeledFormElement({
            mode: 'edit', value: '', required: false, disabled: false, rules: [], ...props
          } as any, jest.fn());
        },
        template: '<input />',
      });

      const Host = defineComponent({
        components: { RcSection, Field },
        template:   `
          <RcSection type="primary" mode="with-header" title="Network" expandable :expanded="false">
            <Field />
          </RcSection>
        `,
      });

      const wrapper = mount(Host);

      await nextTick();

      return wrapper;
    };

    it('should report a field whose rules fail, even before it is touched', async() => {
      const wrapper = await mountInSection({ rules: [required] });

      expect(wrapper.find(ICON).exists()).toBe(true);
    });

    it('should not report a field whose rules pass', async() => {
      const wrapper = await mountInSection({ value: 'set', rules: [required] });

      expect(wrapper.find(ICON).exists()).toBe(false);
    });

    it('should not report a field in view mode', async() => {
      const wrapper = await mountInSection({ mode: 'view', rules: [required] });

      expect(wrapper.find(ICON).exists()).toBe(false);
    });
  });
});
