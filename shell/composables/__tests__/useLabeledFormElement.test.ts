import { useLabeledFormElement } from '@shell/composables/useLabeledFormElement';
import { _VIEW, _EDIT } from '@shell/config/query-params';

function makeProps(overrides = {}): any {
  return {
    mode:         _EDIT,
    value:        '',
    required:     false,
    disabled:     false,
    rules:        [],
    requireDirty: true,
    ...overrides,
  };
}

describe('useLabeledFormElement', () => {
  let emit: jest.Mock;

  beforeEach(() => {
    emit = jest.fn();
  });

  describe('raised initial value', () => {
    it.each([
      {
        desc:     'mode is _VIEW with empty value',
        props:    { mode: _VIEW, value: '' },
        expected: true,
      },
      {
        desc:     'mode is _EDIT with non-empty string value',
        props:    { mode: _EDIT, value: 'hello' },
        expected: true,
      },
      {
        desc:     'mode is _EDIT with empty string value',
        props:    { mode: _EDIT, value: '' },
        expected: false,
      },
    ])('is $expected when $desc', ({ props, expected }) => {
      const { raised } = useLabeledFormElement(makeProps(props), emit);

      expect(raised.value).toStrictEqual(expected);
    });
  });

  describe('requiredField', () => {
    it('is true when required prop is true', () => {
      const { requiredField } = useLabeledFormElement(makeProps({ required: true }), emit);

      expect(requiredField.value).toBe(true);
    });

    it('is true when rules contain a named required function', () => {
      function required(val: any) {
        return !val ? 'Required' : undefined;
      }

      const { requiredField } = useLabeledFormElement(makeProps({ rules: [required] }), emit);

      expect(requiredField.value).toBe(true);
    });

    it('is false when required is false and no rules have required name', () => {
      function otherRule(val: any) {
        return undefined;
      }

      const { requiredField } = useLabeledFormElement(makeProps({ rules: [otherRule] }), emit);

      expect(requiredField.value).toBe(false);
    });

    it('is false with empty rules array and required false', () => {
      const { requiredField } = useLabeledFormElement(makeProps(), emit);

      expect(requiredField.value).toBe(false);
    });

    it('is false when rules array contains a null element', () => {
      const { requiredField } = useLabeledFormElement(makeProps({ rules: [null] }), emit);

      expect(requiredField.value).toBe(false);
    });
  });

  describe('empty', () => {
    it.each([
      {
        desc:     'non-empty string value',
        value:    'hello',
        expected: true,
      },
      {
        desc:     'empty string value',
        value:    '',
        expected: false,
      },
      {
        desc:     'numeric zero value',
        value:    0,
        expected: true,
      },
    ])('returns $expected for $desc', ({ value, expected }) => {
      const { empty } = useLabeledFormElement(makeProps({ value }), emit);

      expect(empty.value).toStrictEqual(expected);
    });
  });

  describe('isView', () => {
    it.each([
      {
        desc:     'mode is _VIEW',
        mode:     _VIEW,
        expected: true,
      },
      {
        desc:     'mode is _EDIT',
        mode:     _EDIT,
        expected: false,
      },
    ])('returns $expected when $desc', ({ mode, expected }) => {
      const { isView } = useLabeledFormElement(makeProps({ mode }), emit);

      expect(isView.value).toStrictEqual(expected);
    });
  });

  describe('isDisabled', () => {
    it.each([
      {
        desc:     'disabled prop is true',
        props:    { disabled: true, mode: _EDIT },
        expected: true,
      },
      {
        desc:     'mode is _VIEW',
        props:    { disabled: false, mode: _VIEW },
        expected: true,
      },
      {
        desc:     'disabled is false and mode is _EDIT',
        props:    { disabled: false, mode: _EDIT },
        expected: false,
      },
    ])('is $expected when $desc', ({ props, expected }) => {
      const { isDisabled } = useLabeledFormElement(makeProps(props), emit);

      expect(isDisabled.value).toStrictEqual(expected);
    });
  });

  describe('onFocusLabeled', () => {
    it('sets raised to true and focused to true', () => {
      const { raised, focused, onFocusLabeled } = useLabeledFormElement(makeProps(), emit);

      expect(raised.value).toBe(false);
      expect(focused.value).toBe(false);

      onFocusLabeled();

      expect(raised.value).toBe(true);
      expect(focused.value).toBe(true);
    });
  });

  describe('onBlurLabeled', () => {
    it('sets focused to false after focus', () => {
      const { focused, onFocusLabeled, onBlurLabeled } = useLabeledFormElement(makeProps({ value: 'some' }), emit);

      onFocusLabeled();
      expect(focused.value).toBe(true);

      onBlurLabeled();

      expect(focused.value).toBe(false);
    });

    it('keeps raised true when value is non-empty after blur', () => {
      const { raised, onBlurLabeled } = useLabeledFormElement(makeProps({ value: 'some' }), emit);

      onBlurLabeled();

      expect(raised.value).toBe(true);
    });

    it('sets raised to false when value is empty after blur', () => {
      const { raised, onFocusLabeled, onBlurLabeled } = useLabeledFormElement(makeProps({ value: '' }), emit);

      onFocusLabeled();
      expect(raised.value).toBe(true);

      onBlurLabeled();

      expect(raised.value).toBe(false);
    });

    it('sets blurred to a non-null timestamp', () => {
      const { blurred, onBlurLabeled } = useLabeledFormElement(makeProps(), emit);

      expect(blurred.value).toBeNull();

      onBlurLabeled();

      expect(blurred.value).toBeGreaterThan(0);
    });
  });

  describe('validationMessage', () => {
    describe('required rule', () => {
      it('returns error message and emits false when blurred and not focused', () => {
        function required(val: any) {
          return !val ? 'Required' : undefined;
        }

        const { validationMessage, blurred } = useLabeledFormElement(
          makeProps({ rules: [required] }),
          emit
        );

        blurred.value = Date.now();

        expect(validationMessage.value).toStrictEqual('Required');
        expect(emit).toHaveBeenCalledWith('update:validation', false);
      });

      it('does not return error when not yet blurred', () => {
        function required(val: any) {
          return !val ? 'Required' : undefined;
        }

        const { validationMessage } = useLabeledFormElement(
          makeProps({ rules: [required] }),
          emit
        );

        // blurred is null → required check is skipped
        expect(validationMessage.value).toBeUndefined();
        expect(emit).toHaveBeenCalledWith('update:validation', true);
      });

      it('returns undefined and emits true when required rule passes', () => {
        function required(val: any) {
          return !val ? 'Required' : undefined;
        }

        const { validationMessage, blurred } = useLabeledFormElement(
          makeProps({ value: 'filled', rules: [required] }),
          emit
        );

        blurred.value = Date.now();

        expect(validationMessage.value).toBeUndefined();
        expect(emit).toHaveBeenCalledWith('update:validation', true);
      });
    });

    describe('non-required rules', () => {
      it('returns error message when blurred', () => {
        function alwaysFails(val: any) {
          return 'Error';
        }

        const { validationMessage, blurred } = useLabeledFormElement(
          makeProps({ value: 'x', rules: [alwaysFails] }),
          emit
        );

        blurred.value = Date.now();

        expect(validationMessage.value).toStrictEqual('Error');
        expect(emit).toHaveBeenCalledWith('update:validation', false);
      });

      it('joins multiple error messages with a comma separator', () => {
        function rule1(val: any) {
          return 'Error1';
        }

        function rule2(val: any) {
          return 'Error2';
        }

        const { validationMessage, blurred } = useLabeledFormElement(
          makeProps({ value: 'x', rules: [rule1, rule2] }),
          emit
        );

        blurred.value = Date.now();

        expect(validationMessage.value).toStrictEqual('Error1, Error2');
        expect(emit).toHaveBeenCalledWith('update:validation', false);
      });

      it('returns undefined and emits true when all rules pass', () => {
        function alwaysPasses(val: any) {
          return undefined;
        }

        const { validationMessage, blurred } = useLabeledFormElement(
          makeProps({ value: 'x', rules: [alwaysPasses] }),
          emit
        );

        blurred.value = Date.now();

        expect(validationMessage.value).toBeUndefined();
        expect(emit).toHaveBeenCalledWith('update:validation', true);
      });

      it('shows errors immediately when requireDirty is false', () => {
        function alwaysFails(val: any) {
          return 'Error';
        }

        const { validationMessage } = useLabeledFormElement(
          makeProps({
            value: 'x', rules: [alwaysFails], requireDirty: false
          }),
          emit
        );

        // blurred is null and focused is false — normally errors are hidden
        // but requireDirty=false bypasses the dirty check
        expect(validationMessage.value).toStrictEqual('Error');
        expect(emit).toHaveBeenCalledWith('update:validation', false);
      });

      it('shows errors when focused even without blur', () => {
        function alwaysFails(val: any) {
          return 'Error';
        }

        const { validationMessage, focused } = useLabeledFormElement(
          makeProps({ value: 'x', rules: [alwaysFails] }),
          emit
        );

        focused.value = true;

        expect(validationMessage.value).toStrictEqual('Error');
        expect(emit).toHaveBeenCalledWith('update:validation', false);
      });

      it('hides errors when not blurred, not focused, and requireDirty is true', () => {
        function alwaysFails(val: any) {
          return 'Error';
        }

        const { validationMessage } = useLabeledFormElement(
          makeProps({
            value: 'x', rules: [alwaysFails], requireDirty: true
          }),
          emit
        );

        expect(validationMessage.value).toBeUndefined();
        expect(emit).toHaveBeenCalledWith('update:validation', true);
      });
    });
  });
});
