import {
  displayKeyFor,
  validateLength,
  validateChars,
  validateHostname,
  validateDnsLabel,
  validateDnsLikeTypes,
  validateBoolean,
} from '@shell/utils/validators';

/**
 * Simple i18n getters mock: i18n/t returns a formatted key string,
 * i18n/exists returns false by default (can be overridden per-test).
 */
function makeGetters(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    'i18n/t':      (key: string, args?: unknown) => (args ? `${ key }:${ JSON.stringify(args) }` : key),
    'i18n/exists': () => false,
    ...overrides,
  };
}

describe('displayKeyFor', () => {
  it('returns i18n label when model label key exists', () => {
    const getters = makeGetters({
      'i18n/exists': (key: string) => key === 'model.Foo.bar.label',
      'i18n/t':      (key: string) => `translated:${ key }`,
    });

    expect(displayKeyFor('Foo', 'bar', getters)).toBe('translated:model.Foo.bar.label');
  });

  it('returns i18n prefix translation when prefix exists but not label', () => {
    const getters = makeGetters({
      'i18n/exists': (key: string) => key === 'model.Foo.bar',
      'i18n/t':      (key: string) => `translated:${ key }`,
    });

    expect(displayKeyFor('Foo', 'bar', getters)).toBe('translated:model.Foo.bar');
  });

  it('strips Id suffix and camelToTitle when key ends with Id', () => {
    const getters = makeGetters();

    expect(displayKeyFor('Foo', 'clusterGroupId', getters)).toBe('Cluster Group');
  });

  it('falls back to camelToTitle for plain keys', () => {
    const getters = makeGetters();

    expect(displayKeyFor('Foo', 'fooBar', getters)).toBe('Foo Bar');
  });
});

describe('validateLength', () => {
  describe('required field validation', () => {
    it('pushes required error for undefined value when required=true and nullable=false', () => {
      const getters = makeGetters();
      const errors = validateLength(undefined, { required: true, nullable: false }, 'Name', getters);

      expect(errors).toStrictEqual(['validation.required:{"key":"Name"}']);
    });

    it('pushes required error for empty string when required=true', () => {
      const getters = makeGetters();
      const errors = validateLength('', { required: true, nullable: false }, 'Name', getters);

      expect(errors).toStrictEqual(['validation.required:{"key":"Name"}']);
    });

    it('pushes required error for empty object when required=true', () => {
      const getters = makeGetters();
      const errors = validateLength({}, { required: true, nullable: false }, 'Name', getters);

      expect(errors).toStrictEqual(['validation.required:{"key":"Name"}']);
    });

    it('does not push required error for 0 when required=true (0 is a valid falsy number)', () => {
      const getters = makeGetters();
      const errors = validateLength(0, { required: true, nullable: false }, 'Name', getters);

      expect(errors).toStrictEqual([]);
    });

    it('returns early without length check when required error is pushed', () => {
      const getters = makeGetters();
      const errors = validateLength(undefined, {
        required: true, nullable: false, minLength: 5, maxLength: 10
      }, 'Name', getters);

      expect(errors).toHaveLength(1);
    });

    it('does not push error for null when nullable=true', () => {
      const getters = makeGetters();
      const errors = validateLength(null, { required: true, nullable: true }, 'Name', getters);

      expect(errors).toStrictEqual([]);
    });
  });

  describe('string length validation', () => {
    it.each([
      {
        desc:     'exactly error when min===max and string length is wrong',
        val:      'ab',
        field:    { minLength: 5, maxLength: 5 },
        key:      'Name',
        expected: 'validation.stringLength.exactly',
      },
      {
        desc:     'between error when min!==max and string length is out of range',
        val:      'ab',
        field:    { minLength: 5, maxLength: 10 },
        key:      'Name',
        expected: 'validation.stringLength.between',
      },
      {
        desc:     'min error when only min is set and string is too short',
        val:      'ab',
        field:    { minLength: 5 },
        key:      'Name',
        expected: 'validation.stringLength.min',
      },
      {
        desc:     'max error when only max is set and string is too long',
        val:      'abcdefghij',
        field:    { maxLength: 5 },
        key:      'Name',
        expected: 'validation.stringLength.max',
      },
      {
        desc:     'arrayLength key for array[ type',
        val:      [],
        field:    { type: 'array[string]', minLength: 1 },
        key:      'Items',
        expected: 'validation.arrayLength.min',
      },
    ])('pushes $desc', ({
      val, field, key, expected,
    }) => {
      const getters = makeGetters();
      const errors = validateLength(val, field, key, getters);

      expect(errors[0]).toContain(expected);
    });

    it('returns no errors when string is within min/max bounds', () => {
      const getters = makeGetters();
      const errors = validateLength('abc', { minLength: 2, maxLength: 5 }, 'Name', getters);

      expect(errors).toStrictEqual([]);
    });
  });

  describe('number min/max validation', () => {
    it.each([
      {
        desc:     'number.exactly when min===max and value is out of range',
        val:      3,
        field:    { min: 5, max: 5 },
        expected: 'validation.number.exactly',
      },
      {
        desc:     'number.between when min!==max and value is out of range',
        val:      3,
        field:    { min: 5, max: 10 },
        expected: 'validation.number.between',
      },
      {
        desc:     'number.min when only min is set and value is below min',
        val:      2,
        field:    { min: 5 },
        expected: 'validation.number.min',
      },
      {
        desc:     'number.max when only max is set and value exceeds max',
        val:      20,
        field:    { max: 10 },
        expected: 'validation.number.max',
      },
    ])('pushes $desc', ({ val, field, expected }) => {
      const getters = makeGetters();
      const errors = validateLength(val, field, 'Count', getters);

      expect(errors[0]).toContain(expected);
    });

    it('returns no errors when number is within range', () => {
      const getters = makeGetters();
      const errors = validateLength(7, { min: 5, max: 10 }, 'Count', getters);

      expect(errors).toStrictEqual([]);
    });
  });
});

describe('validateChars', () => {
  it('pushes chars error when value contains invalid chars defined by validChars', () => {
    const getters = makeGetters();
    const errors = validateChars('hello!', { validChars: 'a-z' }, 'Name', getters);

    expect(errors[0]).toContain('validation.chars');
    expect(errors[0]).toContain('!');
  });

  it('pushes chars error when value contains chars in invalidChars', () => {
    const getters = makeGetters();
    const errors = validateChars('hello world', { invalidChars: ' ' }, 'Name', getters);

    expect(errors[0]).toContain('validation.chars');
    expect(errors[0]).toContain('[space]');
  });

  it('converts space character to [space] in the error message', () => {
    const getters = makeGetters();
    const errors = validateChars('foo bar', { invalidChars: ' ' }, 'Name', getters);

    expect(errors[0]).toContain('[space]');
    expect(errors[0]).not.toContain('" "');
  });

  it('deduplicates repeated invalid chars in error message', () => {
    const getters = makeGetters();
    const errors = validateChars('a!b!c!', { validChars: 'a-z' }, 'Name', getters);

    // should only contain one unique '!' in the chars list
    const charsArg = errors[0];

    expect((charsArg.match(/!/g) || [])).toHaveLength(1);
  });

  it('returns no errors when value matches validChars', () => {
    const getters = makeGetters();
    const errors = validateChars('hello', { validChars: 'a-z' }, 'Name', getters);

    expect(errors).toStrictEqual([]);
  });

  it('returns no errors when no validChars or invalidChars defined', () => {
    const getters = makeGetters();
    const errors = validateChars('anything!@#', {}, 'Name', getters);

    expect(errors).toStrictEqual([]);
  });
});

describe('validateHostname', () => {
  it.each([
    {
      desc:     'startDot when hostname starts with a dot',
      val:      '.example.com',
      opts:     {},
      expected: 'startDot',
    },
    {
      desc:     'empty when hostname is empty string',
      val:      '',
      opts:     {},
      expected: 'empty',
    },
    {
      desc:     'tooLong when hostname exceeds 253 characters',
      val:      'a'.repeat(254),
      opts:     {},
      expected: 'tooLong',
    },
    {
      desc:     'tooLong with custom max length option',
      val:      'abcdef',
      opts:     { max: 5 },
      expected: 'tooLong',
    },
    {
      desc:     'endDot in restricted mode when hostname ends with dot',
      val:      'example.com.',
      opts:     { restricted: true },
      expected: 'endDot',
    },
  ])('pushes $desc', ({ val, opts, expected }) => {
    const getters = makeGetters();
    const errors = validateHostname(val, 'Host', getters, opts);

    expect(errors.some((e: string) => e.includes(expected))).toBe(true);
  });

  it.each([
    {
      desc: 'trailing dot in non-restricted mode (FQDN notation)',
      val:  'example.com.',
      opts: { restricted: false },
    },
    {
      desc: 'a valid simple hostname',
      val:  'my-host',
      opts: {},
    },
    {
      desc: 'a valid FQDN',
      val:  'my-host.example.com',
      opts: {},
    },
  ])('allows $desc', ({ val, opts }) => {
    const getters = makeGetters();
    const errors = validateHostname(val, 'Host', getters, opts);

    expect(errors).toStrictEqual([]);
  });
});

describe('validateDnsLabel', () => {
  it.each([
    {
      desc:     'startHyphen when label starts with a hyphen',
      label:    '-bad',
      opts:     {},
      expected: 'startHyphen',
    },
    {
      desc:     'endHyphen when label ends with a hyphen',
      label:    'bad-',
      opts:     {},
      expected: 'endHyphen',
    },
    {
      desc:     'emptyLabel when label is empty',
      label:    '',
      opts:     {},
      expected: 'emptyLabel',
    },
    {
      desc:     'tooLongLabel when label exceeds 63 characters',
      label:    'a'.repeat(64),
      opts:     {},
      expected: 'tooLongLabel',
    },
    {
      desc:     'startNumber in restricted mode when label starts with a digit',
      label:    '1abc',
      opts:     { restricted: true },
      expected: 'startNumber',
    },
    {
      desc:     'doubleHyphen when label has -- at 3rd and 4th position (non-xn prefix)',
      label:    'ab--cd',
      opts:     {},
      expected: 'doubleHyphen',
    },
    {
      desc:     'doubleHyphen for ianaServiceName with any consecutive hyphens',
      label:    'xn--valid',
      opts:     { ianaServiceName: true },
      expected: 'doubleHyphen',
    },
    {
      desc:     'hostname.startHyphen when forHostname=true',
      label:    '-bad',
      opts:     { forHostname: true },
      expected: 'hostname.startHyphen',
    },
  ])('pushes $desc', ({ label, opts, expected }) => {
    const getters = makeGetters();
    const errors = validateDnsLabel(label, 'Label', getters, opts);

    expect(errors.some((e: string) => e.includes(expected))).toBe(true);
  });

  it.each([
    {
      desc:  'a valid DNS label',
      label: 'my-label',
      opts:  {},
    },
    {
      desc:  'digit-start in non-restricted mode',
      label: '1abc',
      opts:  { restricted: false },
    },
    {
      desc:  'xn-- prefix (IDN string)',
      label: 'xn--nxasmq6b',
      opts:  {},
    },
  ])('allows $desc without errors', ({ label, opts }) => {
    const getters = makeGetters();
    const errors = validateDnsLabel(label, 'Label', getters, opts);

    expect(errors).toStrictEqual([]);
  });
});

describe('validateDnsLikeTypes', () => {
  it.each([
    {
      desc:     'dnsLabel type pushes error for empty label',
      val:      '',
      type:     'dnsLabel',
      expected: 'emptyLabel',
    },
    {
      desc:     'dnsLabelRestricted type pushes startNumber for digit-start',
      val:      '1abc',
      type:     'dnsLabelRestricted',
      expected: 'startNumber',
    },
    {
      desc:     'hostname type pushes startDot for dot-start',
      val:      '.bad',
      type:     'hostname',
      expected: 'startDot',
    },
  ])('validates $desc', ({ val, type, expected }) => {
    const getters = makeGetters();
    const errors = validateDnsLikeTypes(val, type, 'Name', getters, {});

    expect(errors.some((e: string) => e.includes(expected))).toBe(true);
  });

  it('returns no errors for unknown type (no-op)', () => {
    const getters = makeGetters();
    const errors = validateDnsLikeTypes('anything', 'unknownType', 'Name', getters, {});

    expect(errors).toStrictEqual([]);
  });
});

describe('validateBoolean', () => {
  it('pushes required error when field is required and value is undefined', () => {
    const getters = makeGetters();
    const errors: string[] = [];

    validateBoolean(undefined, { required: true }, 'Flag', getters, errors);

    expect(errors.some((e: string) => e.includes('validation.required'))).toBe(true);
  });

  it('does not push required error when value is false (explicitly set)', () => {
    const getters = makeGetters();
    const errors: string[] = [];

    validateBoolean(false, { required: true }, 'Flag', getters, errors);

    expect(errors).toStrictEqual([]);
  });

  it('does not push required error when value is true', () => {
    const getters = makeGetters();
    const errors: string[] = [];

    validateBoolean(true, { required: true }, 'Flag', getters, errors);

    expect(errors).toStrictEqual([]);
  });

  it('pushes boolean error when value is non-boolean truthy (e.g. string)', () => {
    const getters = makeGetters();
    const errors: string[] = [];

    validateBoolean('yes', { required: false }, 'Flag', getters, errors);

    expect(errors.some((e: string) => e.includes('validation.boolean'))).toBe(true);
  });

  it('does not push error when field is not required and value is undefined', () => {
    const getters = makeGetters();
    const errors: string[] = [];

    validateBoolean(undefined, { required: false }, 'Flag', getters, errors);

    expect(errors).toStrictEqual([]);
  });

  it('does not push boolean error for numeric 0 when required=false and val is falsy', () => {
    const getters = makeGetters();
    const errors: string[] = [];

    validateBoolean(0, { required: false }, 'Flag', getters, errors);

    expect(errors).toStrictEqual([]);
  });
});
