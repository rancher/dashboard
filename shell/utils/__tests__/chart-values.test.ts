import jsyaml from 'js-yaml';
import {
  mergeOverrides, mergeOverridesRawText, overridesFromValues, sameYamlOverrides, overridesAreMergeable
} from '@shell/utils/chart-values';

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

  describe('overridesAreMergeable', () => {
    it.each([
      ['empty', ''],
      ['null', null as any],
      ['whitespace only', '  \n\n'],
      ['a mapping', 'foo: bar\n'],
      ['a nested mapping', 'image:\n  tag: 2.0.0\n'],
    ])('treats %s as mergeable', (_label, input) => {
      expect(overridesAreMergeable(input)).toBe(true);
    });

    it.each([
      ['invalid YAML', ':\n  not valid: :yaml'],
      ['a bare string', 'foo'],
      ['a scalar number', '42'],
      ['a top-level array', '- a\n- b'],
    ])('treats %s as not mergeable', (_label, input) => {
      expect(overridesAreMergeable(input)).toBe(false);
    });
  });

  describe('mergeOverridesRawText', () => {
    it('merges normally when the whole overrides document is valid', () => {
      const merged = mergeOverridesRawText(defaults, 'service:\n  port: 9090\n');

      // identical to a plain merge - no raw text handling needed
      expect(merged).toStrictEqual(mergeOverrides(defaults, 'service:\n  port: 9090\n'));
      expect(jsyaml.load(merged)).toStrictEqual({
        ...defaults,
        service: {
          port: 9090, targetPort: 8086, type: 'ClusterIP'
        },
      });
    });

    it('merges the valid part (keeping sibling context) and appends the raw mid-edit remainder', () => {
      // `imagePullSecre` is an incomplete last line - the document as a whole
      // doesn't parse, but the `service.port` override above it still merges.
      const merged = mergeOverridesRawText(defaults, 'service:\n  port: 9090\nimagePullSecre');

      // the valid override merged, and untouched siblings are kept for context
      expect(merged).toContain('port: 9090');
      expect(merged).toContain('targetPort: 8086');
      expect(merged).toContain('type: ClusterIP');
      // the raw mid-edit line the user typed is preserved at the end, not dropped
      expect(merged.endsWith('imagePullSecre\n')).toBe(true);
    });

    it('appends every raw line the user typed, not just the first', () => {
      const merged = mergeOverridesRawText(defaults, 'service:\n  port: 9090\nimagePullSecrets\nsdsad\ndas\nad');

      expect(merged).toContain('port: 9090');
      expect(merged.endsWith('imagePullSecrets\nsdsad\ndas\nad\n')).toBe(true);
    });

    it('keeps the defaults as context and appends the raw text when nothing parses', () => {
      const merged = mergeOverridesRawText(defaults, 'broken');

      // full defaults document is still there for context ...
      expect(merged).toContain('port: 80');
      expect(merged).toContain('targetPort: 8086');
      // ... with the raw line the user typed shown at the end
      expect(merged.endsWith('broken\n')).toBe(true);
    });

    it('returns the plain defaults when the overrides are empty', () => {
      expect(jsyaml.load(mergeOverridesRawText(defaults, ''))).toStrictEqual(defaults);
      expect(jsyaml.load(mergeOverridesRawText(defaults, null as any))).toStrictEqual(defaults);
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
