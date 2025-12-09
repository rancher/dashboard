import Workload from '@shell/detail/workload/index.vue';

const { findMatchingIngresses } = Workload.methods;

describe('findMatchingIngresses', () => {
  it('should do nothing if ingress schema is not present', () => {
    const mockThis = {
      ingressSchema:     undefined,
      matchingIngresses: [],
    };

    findMatchingIngresses.call(mockThis);
    expect(mockThis.matchingIngresses).toStrictEqual([]);
  });

  it('should not find any ingresses if there are none', () => {
    const mockThis = {
      ingressSchema:     true,
      allIngresses:      [],
      matchingServices:  [],
      matchingIngresses: [],
      value:             { metadata: { namespace: 'test' } }
    };

    findMatchingIngresses.call(mockThis);
    expect(mockThis.matchingIngresses).toStrictEqual([]);
  });

  it('should find matching ingresses', () => {
    const mockThis = {
      ingressSchema: true,
      allIngresses:  [
        { // matching
          metadata: { namespace: 'test' },
          spec:     { rules: [{ http: { paths: [{ backend: { service: { name: 'service1' } } }] } }] }
        }
      ],
      matchingServices:  [{ metadata: { name: 'service1' } }],
      matchingIngresses: [],
      value:             { metadata: { namespace: 'test' } }
    };

    findMatchingIngresses.call(mockThis);
    expect(mockThis.matchingIngresses).toHaveLength(1);
    expect(mockThis.matchingIngresses[0]).toStrictEqual(mockThis.allIngresses[0]);
  });

  it('should not match ingresses from other namespaces', () => {
    const mockThis = {
      ingressSchema: true,
      allIngresses:  [
        { // not matching
          metadata: { namespace: 'other' },
          spec:     { rules: [{ http: { paths: [{ backend: { service: { name: 'service1' } } }] } }] }
        }
      ],
      matchingServices:  [{ metadata: { name: 'service1' } }],
      matchingIngresses: [],
      value:             { metadata: { namespace: 'test' } }
    };

    findMatchingIngresses.call(mockThis);
    expect(mockThis.matchingIngresses).toHaveLength(0);
  });

  it('should not match ingresses pointing to other services', () => {
    const mockThis = {
      ingressSchema: true,
      allIngresses:  [
        { // not matching
          metadata: { namespace: 'test' },
          spec:     { rules: [{ http: { paths: [{ backend: { service: { name: 'service2' } } }] } }] }
        }
      ],
      matchingServices:  [{ metadata: { name: 'service1' } }],
      matchingIngresses: [],
      value:             { metadata: { namespace: 'test' } }
    };

    findMatchingIngresses.call(mockThis);
    expect(mockThis.matchingIngresses).toHaveLength(0);
  });

  it('should handle ingresses with no rules', () => {
    const mockThis = {
      ingressSchema: true,
      allIngresses:  [
        {
          metadata: { namespace: 'test' },
          spec:     { }
        }
      ],
      matchingServices:  [{ metadata: { name: 'service1' } }],
      matchingIngresses: [],
      value:             { metadata: { namespace: 'test' } }
    };

    findMatchingIngresses.call(mockThis);
    expect(mockThis.matchingIngresses).toHaveLength(0);
  });

  it('should handle ingress rules with no paths', () => {
    const mockThis = {
      ingressSchema: true,
      allIngresses:  [
        {
          metadata: { namespace: 'test' },
          spec:     { rules: [{ http: {} }] }
        }
      ],
      matchingServices:  [{ metadata: { name: 'service1' } }],
      matchingIngresses: [],
      value:             { metadata: { namespace: 'test' } }
    };

    findMatchingIngresses.call(mockThis);
    expect(mockThis.matchingIngresses).toHaveLength(0);
  });

  it('should handle ingress paths with no backend service', () => {
    const mockThis = {
      ingressSchema: true,
      allIngresses:  [
        {
          metadata: { namespace: 'test' },
          spec:     { rules: [{ http: { paths: [{ backend: {} }] } }] }
        }
      ],
      matchingServices:  [{ metadata: { name: 'service1' } }],
      matchingIngresses: [],
      value:             { metadata: { namespace: 'test' } }
    };

    findMatchingIngresses.call(mockThis);
    expect(mockThis.matchingIngresses).toHaveLength(0);
  });

  it('should find one of many ingresses', () => {
    const mockThis = {
      ingressSchema: true,
      allIngresses:  [
        { // not matching
          metadata: { namespace: 'other' },
          spec:     { rules: [{ http: { paths: [{ backend: { service: { name: 'service1' } } }] } }] }
        },
        { // matching
          metadata: { namespace: 'test' },
          spec:     { rules: [{ http: { paths: [{ backend: { service: { name: 'service1' } } }] } }] }
        },
        { // not matching
          metadata: { namespace: 'test' },
          spec:     { rules: [{ http: { paths: [{ backend: { service: { name: 'service2' } } }] } }] }
        }
      ],
      matchingServices:  [{ metadata: { name: 'service1' } }],
      matchingIngresses: [],
      value:             { metadata: { namespace: 'test' } }
    };

    findMatchingIngresses.call(mockThis);
    expect(mockThis.matchingIngresses).toHaveLength(1);
    expect(mockThis.matchingIngresses[0]).toStrictEqual(mockThis.allIngresses[1]);
  });
});
