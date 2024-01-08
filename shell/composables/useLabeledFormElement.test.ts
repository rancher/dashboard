import { ref } from 'vue';
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
});
