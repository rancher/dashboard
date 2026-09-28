import { useForm } from 'vee-validate';
import { useFormRules, useFormValidation } from './useFormValidation';
import formRulesGenerator from '@shell/utils/validators/formRules/index';

jest.mock('@shell/utils/validators/formRules/index', () => ({
  __esModule: true,
  default:    jest.fn(),
}));

jest.mock('vee-validate', () => ({ useForm: jest.fn() }));

const mockT = (key: string) => key;

describe('useFormRules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (formRulesGenerator as jest.Mock).mockReturnValue({});
  });

  describe('getRules', () => {
    it('returns empty array when ruleSets is empty', () => {
      const { getRules } = useFormRules(mockT, []);

      expect(getRules('anything')).toStrictEqual([]);
    });

    it('returns empty array for a path not present in ruleSets', () => {
      const { getRules } = useFormRules(mockT, [{ path: 'name', rules: ['required'] }]);

      expect(getRules('missing')).toStrictEqual([]);
    });

    it('uses "Value" as key when translationKey is not set', () => {
      const mockValidator = jest.fn();

      (formRulesGenerator as jest.Mock).mockReturnValue({ required: mockValidator });

      const { getRules } = useFormRules(mockT, [{ path: 'name', rules: ['required'] }]);

      getRules('name');

      expect(formRulesGenerator).toHaveBeenCalledWith(mockT, { key: 'Value' });
    });

    it('uses t(translationKey) as key when translationKey is provided', () => {
      const t = (key: string) => `translated:${ key }`;
      const mockValidator = jest.fn();

      (formRulesGenerator as jest.Mock).mockReturnValue({ required: mockValidator });

      const { getRules } = useFormRules(t, [{
        path: 'name', rules: ['required'], translationKey: 'fields.name'
      }]);

      getRules('name');

      expect(formRulesGenerator).toHaveBeenCalledWith(t, { key: 'translated:fields.name' });
    });

    it('returns the validator function for a matched rule', () => {
      const mockValidator = jest.fn();

      (formRulesGenerator as jest.Mock).mockReturnValue({ required: mockValidator });

      const { getRules } = useFormRules(mockT, [{ path: 'name', rules: ['required'] }]);

      expect(getRules('name')).toStrictEqual([mockValidator]);
    });

    it('returns validators in declaration order for multiple rules', () => {
      const required = jest.fn();
      const minLength = jest.fn();

      (formRulesGenerator as jest.Mock).mockReturnValue({ required, minLength });

      const { getRules } = useFormRules(mockT, [{ path: 'name', rules: ['required', 'minLength'] }]);

      expect(getRules('name')).toStrictEqual([required, minLength]);
    });

    it('extraRules provide validators not in formRulesGenerator', () => {
      const customValidator = jest.fn();

      (formRulesGenerator as jest.Mock).mockReturnValue({});

      const { getRules } = useFormRules(mockT, [{ path: 'name', rules: ['custom'] }], { custom: customValidator });

      expect(getRules('name')).toStrictEqual([customValidator]);
    });

    it('extraRules override same-named rules from formRulesGenerator', () => {
      const original = jest.fn();
      const override = jest.fn();

      (formRulesGenerator as jest.Mock).mockReturnValue({ required: original });

      const { getRules } = useFormRules(mockT, [{ path: 'name', rules: ['required'] }], { required: override });

      expect(getRules('name')).toStrictEqual([override]);
    });

    it('resolves rules for two different paths independently', () => {
      const nameValidator = jest.fn();
      const emailValidator = jest.fn();

      (formRulesGenerator as jest.Mock).mockReturnValue({ nameRule: nameValidator, emailRule: emailValidator });

      const { getRules } = useFormRules(mockT, [
        {
          path:  'name',
          rules: ['nameRule'],
        },
        {
          path:  'email',
          rules: ['emailRule'],
        },
      ]);

      expect(getRules('name')).toStrictEqual([nameValidator]);
      expect(getRules('email')).toStrictEqual([emailValidator]);
    });

    it('throws for an unknown rule name in non-production environment', () => {
      (formRulesGenerator as jest.Mock).mockReturnValue({});

      const { getRules } = useFormRules(mockT, [{ path: 'name', rules: ['unknownRule'] }]);

      expect(() => getRules('name')).toThrow('[useFormValidation] Unknown validation rule: "unknownRule"');
    });

    it('returns a nullValidator in production environment for an unknown rule name', () => {
      const saved = process.env.NODE_ENV;

      process.env.NODE_ENV = 'production';

      (formRulesGenerator as jest.Mock).mockReturnValue({});

      const { getRules } = useFormRules(mockT, [{ path: 'name', rules: ['unknownRule'] }]);
      const validators = getRules('name');

      process.env.NODE_ENV = saved;

      expect(validators).toHaveLength(1);
      expect(validators[0]('any value')).toBeUndefined();
    });
  });
});

describe('useFormValidation', () => {
  const mockErrors = { value: {} as Record<string, string> };
  const mockValidate = jest.fn();

  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockErrors.value = {};
    mockValidate.mockResolvedValue({ valid: true, errors: {} });
    (formRulesGenerator as jest.Mock).mockReturnValue({});
    (useForm as jest.Mock).mockReturnValue({
      errors:   mockErrors,
      validate: mockValidate,
    });
    // suppress Vue's "provide() can only be used inside setup()" warning
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('returns the expected interface shape', () => {
    const {
      getRules, isFormValid, validateForm, veeErrors, showAllErrors
    } = useFormValidation(mockT, []);

    expect(typeof getRules).toBe('function');
    expect(typeof validateForm).toBe('function');
    expect(typeof isFormValid.value).toBe('boolean');
    expect(veeErrors).toBe(mockErrors);
    expect(showAllErrors.value).toBe(false);
  });

  it('isFormValid is true when veeErrors is empty', () => {
    mockErrors.value = {};

    const { isFormValid } = useFormValidation(mockT, []);

    expect(isFormValid.value).toBe(true);
  });

  it('isFormValid is false when veeErrors has entries', () => {
    mockErrors.value = { name: 'required' };

    const { isFormValid } = useFormValidation(mockT, []);

    expect(isFormValid.value).toBe(false);
  });

  it('validateForm invokes the underlying vee-validate validate function', async() => {
    const { validateForm } = useFormValidation(mockT, []);

    await validateForm();

    expect(mockValidate).toHaveBeenCalledWith();
  });

  it('validateForm sets showAllErrors to true', async() => {
    const { validateForm, showAllErrors } = useFormValidation(mockT, []);

    expect(showAllErrors.value).toBe(false);

    await validateForm();

    expect(showAllErrors.value).toBe(true);
  });

  it('validateForm returns the result from vee-validate', async() => {
    const expected = {
      valid:  false,
      errors: { name: 'required' },
    };

    mockValidate.mockResolvedValue(expected);

    const { validateForm } = useFormValidation(mockT, []);
    const result = await validateForm();

    expect(result).toStrictEqual(expected);
  });
});
