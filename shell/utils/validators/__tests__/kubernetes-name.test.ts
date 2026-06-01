import { validateKubernetesName } from '@shell/utils/validators/kubernetes-name';

function makeGetters(): Record<string, unknown> {
  return {
    'i18n/t':      (key: string, args?: unknown) => (args ? `${ key }:${ JSON.stringify(args) }` : key),
    'i18n/exists': () => false,
  };
}

describe('validateKubernetesName', () => {
  describe('valid names', () => {
    it('accepts a simple lowercase name', () => {
      const errors = validateKubernetesName('my-app', 'Name', makeGetters(), {});

      expect(errors).toStrictEqual([]);
    });

    it('accepts alphanumeric name', () => {
      const errors = validateKubernetesName('abc123', 'Name', makeGetters(), {});

      expect(errors).toStrictEqual([]);
    });

    it('accepts single character', () => {
      const errors = validateKubernetesName('a', 'Name', makeGetters(), {});

      expect(errors).toStrictEqual([]);
    });

    it('accepts name at max length (63)', () => {
      const name = 'a'.repeat(63);
      const errors = validateKubernetesName(name, 'Name', makeGetters(), {});

      expect(errors).toStrictEqual([]);
    });

    it('accepts uppercase letters by default validChars', () => {
      const errors = validateKubernetesName('MyApp', 'Name', makeGetters(), {});

      expect(errors).toStrictEqual([]);
    });
  });

  describe('invalid characters', () => {
    it('rejects underscores', () => {
      const errors = validateKubernetesName('my_app', 'Name', makeGetters(), {});

      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects dots', () => {
      const errors = validateKubernetesName('my.app', 'Name', makeGetters(), {});

      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects spaces', () => {
      const errors = validateKubernetesName('my app', 'Name', makeGetters(), {});

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('hyphen position rules', () => {
    it('rejects name starting with hyphen', () => {
      const errors = validateKubernetesName('-myapp', 'Name', makeGetters(), {});

      expect(errors).toContain('validation.dns.label.startHyphen:{"key":"Name"}');
    });

    it('rejects name ending with hyphen', () => {
      const errors = validateKubernetesName('myapp-', 'Name', makeGetters(), {});

      expect(errors).toContain('validation.dns.label.endHyphen:{"key":"Name"}');
    });

    it('rejects name starting and ending with hyphen', () => {
      const errors = validateKubernetesName('-myapp-', 'Name', makeGetters(), {});

      expect(errors).toContain('validation.dns.label.startHyphen:{"key":"Name"}');
      expect(errors).toContain('validation.dns.label.endHyphen:{"key":"Name"}');
    });

    it('allows hyphen in the middle', () => {
      const errors = validateKubernetesName('my-app', 'Name', makeGetters(), {});

      expect(errors).toStrictEqual([]);
    });
  });

  describe('length rules', () => {
    it('rejects empty string', () => {
      const errors = validateKubernetesName('', 'Name', makeGetters(), {});

      expect(errors).toContain('validation.dns.label.emptyLabel:{"key":"Name","min":1}');
    });

    it('rejects name exceeding 63 characters', () => {
      const name = 'a'.repeat(64);
      const errors = validateKubernetesName(name, 'Name', makeGetters(), {});

      expect(errors).toContain('validation.dns.label.tooLongLabel:{"key":"Name","max":63}');
    });

    it('respects custom maxLength option', () => {
      const errors = validateKubernetesName('ab', 'Name', makeGetters(), { maxLength: 1 });

      expect(errors).toContain('validation.dns.label.tooLongLabel:{"key":"Name","max":1}');
    });

    it('respects custom minLength option', () => {
      const errors = validateKubernetesName('ab', 'Name', makeGetters(), { minLength: 5 });

      expect(errors).toContain('validation.dns.label.emptyLabel:{"key":"Name","min":5}');
    });
  });

  describe('hostname mode', () => {
    it('uses hostname errorKey when forHostname is true', () => {
      const errors = validateKubernetesName('-myapp', 'Name', makeGetters(), { forHostname: true });

      expect(errors).toContain('validation.dns.hostname.startHyphen:{"key":"Name"}');
    });

    it('uses label errorKey by default', () => {
      const errors = validateKubernetesName('-myapp', 'Name', makeGetters(), {});

      expect(errors).toContain('validation.dns.label.startHyphen:{"key":"Name"}');
    });
  });

  describe('custom errorKey', () => {
    it('uses custom errorKey when provided', () => {
      const errors = validateKubernetesName('-myapp', 'Name', makeGetters(), { errorKey: 'custom' });

      expect(errors).toContain('validation.dns.custom.startHyphen:{"key":"Name"}');
    });
  });

  describe('errors array accumulation', () => {
    it('appends to existing errors array', () => {
      const existing = ['existing-error'];
      const errors = validateKubernetesName('', 'Name', makeGetters(), {}, existing);

      expect(errors[0]).toBe('existing-error');
      expect(errors.length).toBeGreaterThan(1);
    });

    it('defaults to empty errors array', () => {
      const errors = validateKubernetesName('valid', 'Name', makeGetters(), {});

      expect(errors).toStrictEqual([]);
    });
  });

  describe('invalidChars option', () => {
    it('rejects characters matching invalidChars pattern', () => {
      const errors = validateKubernetesName('my-App', 'Name', makeGetters(), { invalidChars: 'A-Z' });

      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
