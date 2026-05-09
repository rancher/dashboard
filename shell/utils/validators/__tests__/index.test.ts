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
    it('pushes exactly error when min===max and string length is wrong', () => {
      const getters = makeGetters();
      const errors = validateLength('ab', { minLength: 5, maxLength: 5 }, 'Name', getters);

      expect(errors[0]).toContain('validation.stringLength.exactly');
    });

    it('pushes between error when min!==max and string length is out of range', () => {
      const getters = makeGetters();
      const errors = validateLength('ab', { minLength: 5, maxLength: 10 }, 'Name', getters);

      expect(errors[0]).toContain('validation.stringLength.between');
    });

    it('pushes min error when only min is set and string is too short', () => {
      const getters = makeGetters();
      const errors = validateLength('ab', { minLength: 5 }, 'Name', getters);

      expect(errors[0]).toContain('validation.stringLength.min');
    });

    it('pushes max error when only max is set and string is too long', () => {
      const getters = makeGetters();
      const errors = validateLength('abcdefghij', { maxLength: 5 }, 'Name', getters);

      expect(errors[0]).toContain('validation.stringLength.max');
    });

    it('returns no errors when string is within min/max bounds', () => {
      const getters = makeGetters();
      const errors = validateLength('abc', { minLength: 2, maxLength: 5 }, 'Name', getters);

      expect(errors).toStrictEqual([]);
    });

    it('uses arrayLength key for array[ type', () => {
      const getters = makeGetters();
      const errors = validateLength([], { type: 'array[string]', minLength: 1 }, 'Items', getters);

      expect(errors[0]).toContain('validation.arrayLength.min');
    });
  });

  describe('number min/max validation', () => {
    it('pushes number.exactly when min===max and value is out of range', () => {
      const getters = makeGetters();
      const errors = validateLength(3, { min: 5, max: 5 }, 'Count', getters);

      expect(errors[0]).toContain('validation.number.exactly');
    });

    it('pushes number.between when min!==max and value is out of range', () => {
      const getters = makeGetters();
      const errors = validateLength(3, { min: 5, max: 10 }, 'Count', getters);

      expect(errors[0]).toContain('validation.number.between');
    });

    it('pushes number.min when only min is set and value is below min', () => {
      const getters = makeGetters();
      const errors = validateLength(2, { min: 5 }, 'Count', getters);

      expect(errors[0]).toContain('validation.number.min');
    });

    it('pushes number.max when only max is set and value exceeds max', () => {
      const getters = makeGetters();
      const errors = validateLength(20, { max: 10 }, 'Count', getters);

      expect(errors[0]).toContain('validation.number.max');
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
  it('pushes startDot error when hostname starts with a dot', () => {
    const getters = makeGetters();
    const errors = validateHostname('.example.com', 'Host', getters, {});

    expect(errors.some((e: string) => e.includes('startDot'))).toBe(true);
  });

  it('pushes empty error when hostname is empty string', () => {
    const getters = makeGetters();
    const errors = validateHostname('', 'Host', getters, {});

    expect(errors.some((e: string) => e.includes('empty'))).toBe(true);
  });

  it('pushes tooLong error when hostname exceeds 253 characters', () => {
    const getters = makeGetters();
    const longName = 'a'.repeat(254);
    const errors = validateHostname(longName, 'Host', getters, {});

    expect(errors.some((e: string) => e.includes('tooLong'))).toBe(true);
  });

  it('respects custom max length option', () => {
    const getters = makeGetters();
    const errors = validateHostname('abcdef', 'Host', getters, { max: 5 });

    expect(errors.some((e: string) => e.includes('tooLong'))).toBe(true);
  });

  it('pushes endDot error in restricted mode when hostname ends with dot', () => {
    const getters = makeGetters();
    const errors = validateHostname('example.com.', 'Host', getters, { restricted: true });

    expect(errors.some((e: string) => e.includes('endDot'))).toBe(true);
  });

  it('allows trailing dot in non-restricted mode (FQDN notation)', () => {
    const getters = makeGetters();
    const errors = validateHostname('example.com.', 'Host', getters, { restricted: false });

    expect(errors.every((e: string) => !e.includes('endDot'))).toBe(true);
  });

  it('returns no errors for a valid simple hostname', () => {
    const getters = makeGetters();
    const errors = validateHostname('my-host', 'Host', getters, {});

    expect(errors).toStrictEqual([]);
  });

  it('returns no errors for a valid FQDN', () => {
    const getters = makeGetters();
    const errors = validateHostname('my-host.example.com', 'Host', getters, {});

    expect(errors).toStrictEqual([]);
  });
});

describe('validateDnsLabel', () => {
  it('returns no errors for a valid DNS label', () => {
    const getters = makeGetters();
    const errors = validateDnsLabel('my-label', 'Label', getters, {});

    expect(errors).toStrictEqual([]);
  });

  it('pushes startHyphen error when label starts with a hyphen', () => {
    const getters = makeGetters();
    const errors = validateDnsLabel('-bad', 'Label', getters, {});

    expect(errors.some((e: string) => e.includes('startHyphen'))).toBe(true);
  });

  it('pushes endHyphen error when label ends with a hyphen', () => {
    const getters = makeGetters();
    const errors = validateDnsLabel('bad-', 'Label', getters, {});

    expect(errors.some((e: string) => e.includes('endHyphen'))).toBe(true);
  });

  it('pushes emptyLabel error when label is empty', () => {
    const getters = makeGetters();
    const errors = validateDnsLabel('', 'Label', getters, {});

    expect(errors.some((e: string) => e.includes('emptyLabel'))).toBe(true);
  });

  it('pushes tooLongLabel error when label exceeds 63 characters', () => {
    const getters = makeGetters();
    const longLabel = 'a'.repeat(64);
    const errors = validateDnsLabel(longLabel, 'Label', getters, {});

    expect(errors.some((e: string) => e.includes('tooLongLabel'))).toBe(true);
  });

  it('pushes startNumber error in restricted mode when label starts with a digit', () => {
    const getters = makeGetters();
    const errors = validateDnsLabel('1abc', 'Label', getters, { restricted: true });

    expect(errors.some((e: string) => e.includes('startNumber'))).toBe(true);
  });

  it('does not push startNumber error in non-restricted mode', () => {
    const getters = makeGetters();
    const errors = validateDnsLabel('1abc', 'Label', getters, { restricted: false });

    expect(errors.every((e: string) => !e.includes('startNumber'))).toBe(true);
  });

  it('pushes doubleHyphen error when label has -- at 3rd and 4th position (non-xn prefix)', () => {
    const getters = makeGetters();
    const errors = validateDnsLabel('ab--cd', 'Label', getters, {});

    expect(errors.some((e: string) => e.includes('doubleHyphen'))).toBe(true);
  });

  it('allows xn-- prefix (IDN string)', () => {
    const getters = makeGetters();
    const errors = validateDnsLabel('xn--nxasmq6b', 'Label', getters, {});

    expect(errors.every((e: string) => !e.includes('doubleHyphen'))).toBe(true);
  });

  it('pushes doubleHyphen error for ianaServiceName with any consecutive hyphens', () => {
    const getters = makeGetters();
    const errors = validateDnsLabel('xn--valid', 'Label', getters, { ianaServiceName: true });

    expect(errors.some((e: string) => e.includes('doubleHyphen'))).toBe(true);
  });

  it('uses hostname errorKey when forHostname=true', () => {
    const getters = makeGetters();
    const errors = validateDnsLabel('-bad', 'Label', getters, { forHostname: true });

    expect(errors.some((e: string) => e.includes('hostname.startHyphen'))).toBe(true);
  });
});

describe('validateDnsLikeTypes', () => {
  it('validates dnsLabel type', () => {
    const getters = makeGetters();
    const errors = validateDnsLikeTypes('', 'dnsLabel', 'Name', getters, {});

    expect(errors.length).toBeGreaterThan(0);
  });

  it('validates dnsLabelRestricted type', () => {
    const getters = makeGetters();
    const errors = validateDnsLikeTypes('1abc', 'dnsLabelRestricted', 'Name', getters, {});

    expect(errors.some((e: string) => e.includes('startNumber'))).toBe(true);
  });

  it('validates hostname type', () => {
    const getters = makeGetters();
    const errors = validateDnsLikeTypes('.bad', 'hostname', 'Name', getters, {});

    expect(errors.some((e: string) => e.includes('startDot'))).toBe(true);
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

  it('does not push boolean error for numeric 1 when required=false and val is falsy', () => {
    const getters = makeGetters();
    const errors: string[] = [];

    validateBoolean(0, { required: false }, 'Flag', getters, errors);

    expect(errors).toStrictEqual([]);
  });
});
