import { defineComponent, nextTick, reactive, ref } from 'vue';
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

  describe('reporting to an RcSection', () => {
    const ICON = '[data-testid="rc-section-invalid-fields"]';
    // Named `required`, which the composable treats as the required rule
    const required = (v: unknown) => (v ? undefined : 'Required');

    // Collapsing the section validates it, so fields show their errors
    const mountInSection = async(props: Record<string, unknown>, collapse = true) => {
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
          <RcSection type="primary" mode="with-header" title="Network" expandable>
            <Field />
          </RcSection>
        `,
      });

      const wrapper = mount(Host);

      if (collapse) {
        await wrapper.find('.section-header').trigger('click');
      }
      await nextTick();

      return wrapper;
    };

    it('should report a field whose rules fail once the section is validated', async() => {
      const wrapper = await mountInSection({ rules: [required] });

      expect(wrapper.find(ICON).exists()).toBe(true);
    });

    it('should not report an untouched field whose rules fail before the section is validated', async() => {
      const wrapper = await mountInSection({ rules: [required] }, false);

      expect(wrapper.find(ICON).exists()).toBe(false);
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

  describe('showing errors once the RcSection is collapsed', () => {
    const required = (v: unknown) => (v ? undefined : 'Required');
    const format = (v: unknown) => (v === 'bad' ? 'Invalid format' : undefined);

    const mountInSection = async(rules: unknown[]) => {
      const Field = defineComponent({
        setup() {
          const value = ref('');
          const props = reactive({
            mode: 'edit', value, required: false, disabled: false, rules, requireDirty: true
          });
          const { validationMessage } = useLabeledFormElement(props as any, jest.fn());

          return { validationMessage, value };
        },
        template: '<input />',
      });

      const Host = defineComponent({
        components: { RcSection, Field },
        template:   `
          <RcSection type="primary" mode="with-header" title="Network" expandable>
            <Field />
          </RcSection>
        `,
      });

      const wrapper = mount(Host);

      await nextTick();

      return { wrapper, field: () => wrapper.findComponent(Field).vm as unknown as { validationMessage: unknown; value: string } };
    };

    it('does not show an untouched error before the section is collapsed', async() => {
      const { field } = await mountInSection([required]);

      expect(field().validationMessage).toBeUndefined();
    });

    it('shows an untouched required error once the section is collapsed', async() => {
      const { wrapper, field } = await mountInSection([required]);

      await wrapper.find('.section-header').trigger('click');

      expect(field().validationMessage).toBe('Required');
    });

    it('shows an untouched rule error once the section is collapsed', async() => {
      const { wrapper, field } = await mountInSection([format]);

      field().value = 'bad';
      await wrapper.find('.section-header').trigger('click');

      expect(field().validationMessage).toBe('Invalid format');
    });

    it('keeps showing the error after the section is expanded again, until it is corrected', async() => {
      const { wrapper, field } = await mountInSection([required]);

      await wrapper.find('.section-header').trigger('click');
      await wrapper.find('.section-header').trigger('click');
      expect(field().validationMessage).toBe('Required');

      field().value = 'set';
      await nextTick();
      expect(field().validationMessage).toBeUndefined();
    });
  });
});
