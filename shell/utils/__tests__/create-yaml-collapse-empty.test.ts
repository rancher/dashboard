import jsyaml from 'js-yaml';
import { createYaml, createYamlWithOptions, isDeepEmpty } from '@shell/utils/create-yaml';

describe('fx: isDeepEmpty', () => {
  it.each([
    [null, true],
    [undefined, true],
    ['', true],
    [{}, true],
    [[], true],
    [{ a: null, b: undefined }, true],
    [{ a: [], b: {} }, true],
    [{ a: { b: { c: [] } } }, true],
    [[[], {}, null], true],
    [0, false],
    [false, false],
    ['x', false],
    [{ a: 0 }, false],
    [{ a: false }, false],
    [{ a: { b: 'x' } }, false],
    [[{ topologyKey: 'k' }], false],
  ])('isDeepEmpty(%j) === %s', (val, expected) => {
    expect(isDeepEmpty(val)).toBe(expected);
  });
});

describe('fx: createYaml collapseEmptyObjects', () => {
  // Mirrors the pod affinity shape: an object type whose sub-fields are arrays.
  const schemas = [
    { id: 'test.pod', type: 'schema', resourceFields: { spec: { type: 'test.podSpec', create: true, update: true } } },
    { id: 'test.podSpec', type: 'schema', resourceFields: { affinity: { type: 'test.affinity', create: true, update: true } } },
    {
      id:             'test.affinity',
      type:           'schema',
      resourceFields: {
        podAffinity:     { type: 'test.podAffinity', create: true, update: true },
        podAntiAffinity: { type: 'test.podAffinity', create: true, update: true },
      }
    },
    {
      id:             'test.podAffinity',
      type:           'schema',
      resourceFields: {
        requiredDuringSchedulingIgnoredDuringExecution:  { type: 'array[test.term]', create: true, update: true },
        preferredDuringSchedulingIgnoredDuringExecution: { type: 'array[test.term]', create: true, update: true },
      }
    },
    { id: 'test.term', type: 'schema', resourceFields: { topologyKey: { type: 'string', create: true, update: true } } },
  ];

  const data = () => ({
    type: 'test.pod',
    spec: {
      affinity: {
        podAffinity: {
          requiredDuringSchedulingIgnoredDuringExecution:  [{ topologyKey: 'test/test' }],
          preferredDuringSchedulingIgnoredDuringExecution: [],
        },
        // Deep-empty: the exact shape the PodAffinity form seeds when unused
        podAntiAffinity: {
          requiredDuringSchedulingIgnoredDuringExecution:  [],
          preferredDuringSchedulingIgnoredDuringExecution: [],
        },
      }
    }
  });

  it('without the flag, an empty podAntiAffinity serialises to an inconsistent null-children object', () => {
    const yaml = createYaml(schemas as any, 'test.pod', data());
    const parsed: any = jsyaml.load(yaml);

    // The undesired representation: not a clean {}, but expanded null children
    expect(parsed.spec.affinity.podAntiAffinity).not.toStrictEqual({});
    expect(parsed.spec.affinity.podAntiAffinity).toStrictEqual({
      requiredDuringSchedulingIgnoredDuringExecution:  null,
      preferredDuringSchedulingIgnoredDuringExecution: null,
    });
    // real data is preserved
    expect(parsed.spec.affinity.podAffinity.requiredDuringSchedulingIgnoredDuringExecution[0].topologyKey).toBe('test/test');
  });

  it('with collapseEmptyObjects, an empty podAntiAffinity renders as {}', () => {
    const yaml = createYamlWithOptions(schemas as any, 'test.pod', data(), { collapseEmptyObjects: true });
    const parsed: any = jsyaml.load(yaml);

    expect(parsed.spec.affinity.podAntiAffinity).toStrictEqual({});
    // objects that actually have content are still rendered in full
    expect(parsed.spec.affinity.podAffinity.requiredDuringSchedulingIgnoredDuringExecution[0].topologyKey).toBe('test/test');
  });
});
