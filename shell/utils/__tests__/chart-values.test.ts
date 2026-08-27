import jsyaml from 'js-yaml';
import { mergeOverrides, overridesFromValues, sameYamlOverrides } from '@shell/utils/chart-values';

describe('fx: chart-values', () => {
  const defaults = {
    image: {
      repository: 'my/repo', tag: '1.0.0', pullPolicy: 'IfNotPresent'
    },
    service: {
      port: 80, targetPort: 8086, type: 'ClusterIP'
    },
    persistence: { enabled: true, size: '8Gi' },
  };

  describe('overridesFromValues', () => {
    it('returns only the values that differ from the defaults', () => {
      const values = { ...defaults, image: { ...defaults.image, tag: '2.0.0' } };

      expect(jsyaml.load(overridesFromValues(defaults, values))).toStrictEqual({ image: { tag: '2.0.0' } });
    });

    it('returns an empty string when there are no overrides', () => {
      expect(overridesFromValues(defaults, { ...defaults })).toStrictEqual('');
    });

    it('treats null/undefined arguments as empty objects', () => {
      expect(overridesFromValues(null as any, null as any)).toStrictEqual('');
      expect(overridesFromValues(undefined as any, undefined as any)).toStrictEqual('');
    });
  });

  describe('mergeOverrides', () => {
    it('merges the edited overrides onto the defaults', () => {
      const merged = mergeOverrides(defaults, 'image:\n  pullSecrets:\n    - application-collection\n');

      expect(jsyaml.load(merged)).toStrictEqual({
        image: {
          repository: 'my/repo', tag: '1.0.0', pullPolicy: 'IfNotPresent', pullSecrets: ['application-collection']
        },
        service: {
          port: 80, targetPort: 8086, type: 'ClusterIP'
        },
        persistence: { enabled: true, size: '8Gi' },
      });
    });

    it('replaces arrays rather than concatenating them', () => {
      const withArray = { list: ['a', 'b'] };
      const merged = mergeOverrides(withArray, 'list:\n  - c\n');

      expect(jsyaml.load(merged)).toStrictEqual({ list: ['c'] });
    });

    it('falls back to the defaults when the overrides YAML is invalid', () => {
      const merged = mergeOverrides(defaults, ':\n  not valid: :yaml');

      expect(jsyaml.load(merged)).toStrictEqual(defaults);
    });

    it('falls back to the defaults when the overrides YAML is empty', () => {
      expect(jsyaml.load(mergeOverrides(defaults, ''))).toStrictEqual(defaults);
      expect(jsyaml.load(mergeOverrides(defaults, null as any))).toStrictEqual(defaults);
    });

    it.each([
      ['a bare string', 'foo'],
      ['a scalar number', '42'],
      ['a scalar boolean', 'true'],
      ['a top-level array', '- a\n- b'],
    ])('ignores %s (not a mapping) rather than merging it into the defaults', (_label, input) => {
      expect(jsyaml.load(mergeOverrides(defaults, input))).toStrictEqual(defaults);
    });
  });

  describe('sameYamlOverrides', () => {
    it.each([
      ['both empty', '', ''],
      ['empty vs whitespace-only newline', '', '\n'],
      ['empty vs blank lines', '', '  \n\n'],
      ['same content with a trailing newline difference', 'foo: bar', 'foo: bar\n'],
      ['null vs empty', null as any, ''],
    ])('treats %s as no change', (_label, a, b) => {
      expect(sameYamlOverrides(a, b)).toBe(true);
    });

    it.each([
      ['added content', '', 'foo: bar\n'],
      ['changed value', 'foo: bar\n', 'foo: baz\n'],
    ])('treats %s as a change', (_label, a, b) => {
      expect(sameYamlOverrides(a, b)).toBe(false);
    });
  });
});
