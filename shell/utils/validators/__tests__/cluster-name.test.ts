import { clusterName } from '@shell/utils/validators/cluster-name';

function makeGetters(): Record<string, unknown> {
  return {
    'i18n/t':      (key: string, args?: unknown) => (args ? `${ key }:${ JSON.stringify(args) }` : key),
    'i18n/exists': () => false,
  };
}

describe('clusterName', () => {
  describe('non-rke2 mode', () => {
    it('returns no errors for any name when not rke2', () => {
      const errors = clusterName('c-abcde', makeGetters(), [], ['false'], 'Name');

      expect(errors).toStrictEqual([]);
    });

    it('returns no errors for local when not rke2', () => {
      const errors = clusterName('local', makeGetters(), [], ['false'], 'Name');

      expect(errors).toStrictEqual([]);
    });

    it('returns no errors for arbitrary name when not rke2', () => {
      const errors = clusterName('my-cluster', makeGetters(), [], ['false'], 'Name');

      expect(errors).toStrictEqual([]);
    });
  });

  describe('rke2 mode', () => {
    it('rejects name matching c-XXXXX pattern', () => {
      const errors = clusterName('c-abcde', makeGetters(), [], ['true'], 'Name');

      expect(errors).toContain('validation.cluster.name');
    });

    it('rejects "local" cluster name', () => {
      const errors = clusterName('local', makeGetters(), [], ['true'], 'Name');

      expect(errors).toContain('validation.cluster.name');
    });

    it('rejects "LOCAL" (case-insensitive match)', () => {
      const errors = clusterName('LOCAL', makeGetters(), [], ['true'], 'Name');

      expect(errors).toContain('validation.cluster.name');
    });

    it('rejects "Local" (mixed case)', () => {
      const errors = clusterName('Local', makeGetters(), [], ['true'], 'Name');

      expect(errors).toContain('validation.cluster.name');
    });

    it('rejects "c-ABCDE" (uppercase legacy id)', () => {
      const errors = clusterName('c-ABCDE', makeGetters(), [], ['true'], 'Name');

      expect(errors).toContain('validation.cluster.name');
    });

    it('accepts a valid rke2 cluster name', () => {
      const errors = clusterName('my-cluster', makeGetters(), [], ['true'], 'Name');

      expect(errors).toStrictEqual([]);
    });

    it('accepts name with more than 5 chars after c-', () => {
      const errors = clusterName('c-abcdef', makeGetters(), [], ['true'], 'Name');

      expect(errors).toStrictEqual([]);
    });

    it('accepts name starting with c- but less than 5 chars after', () => {
      const errors = clusterName('c-abc', makeGetters(), [], ['true'], 'Name');

      expect(errors).toStrictEqual([]);
    });
  });

  describe('empty/null pathValue', () => {
    it('handles empty string without throwing', () => {
      const errors = clusterName('', makeGetters(), [], ['true'], 'Name');

      expect(errors).toStrictEqual([]);
    });

    it('handles null without throwing', () => {
      const errors = clusterName(null, makeGetters(), [], ['true'], 'Name');

      expect(errors).toStrictEqual([]);
    });

    it('handles undefined without throwing', () => {
      const errors = clusterName(undefined, makeGetters(), [], ['true'], 'Name');

      expect(errors).toStrictEqual([]);
    });
  });

  describe('errors array accumulation', () => {
    it('appends to existing errors array', () => {
      const existing = ['prior-error'];
      const errors = clusterName('local', makeGetters(), existing, ['true'], 'Name');

      expect(errors[0]).toBe('prior-error');
      expect(errors).toContain('validation.cluster.name');
    });
  });
});
