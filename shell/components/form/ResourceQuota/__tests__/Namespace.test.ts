import { shallowMount } from '@vue/test-utils';
import Namespace from '@shell/components/form/ResourceQuota/Namespace.vue';

describe('namespace', () => {
  const makeProject = (overrides: Record<string, unknown> = {}) => ({
    spec: {
      resourceQuota:                 { limit: {} },
      namespaceDefaultResourceQuota: { limit: {} }
    },
    namespaces: [],
    ...overrides
  });

  const defaultProps = {
    mode:    'edit',
    types:   [],
    value:   { resourceQuota: { limit: {} } },
    project: makeProject()
  };

  const createWrapper = (propsOverrides: Record<string, unknown> = {}) => {
    return shallowMount(Namespace, { props: { ...defaultProps, ...propsOverrides } });
  };

  describe('computed: projectResourceQuotaLimits', () => {
    it('passes standard quota keys through unchanged', () => {
      const wrapper: any = createWrapper({
        project: makeProject({
          spec: {
            resourceQuota:                 { limit: { limitsCpu: '2000m', configMaps: '10' } },
            namespaceDefaultResourceQuota: { limit: {} }
          }
        })
      });

      expect(wrapper.vm.projectResourceQuotaLimits).toStrictEqual({
        limitsCpu:  '2000m',
        configMaps: '10'
      });
    });

    it('flattens extended resources to dotted keys', () => {
      const wrapper: any = createWrapper({
        project: makeProject({
          spec: {
            resourceQuota:                 { limit: { extended: { 'requests.nvidia.com/gpu': '4' } } },
            namespaceDefaultResourceQuota: { limit: {} }
          }
        })
      });

      expect(wrapper.vm.projectResourceQuotaLimits).toStrictEqual({ 'extended.requests.nvidia.com/gpu': '4' });
    });

    it('flattens multiple extended entries alongside standard keys', () => {
      const wrapper: any = createWrapper({
        project: makeProject({
          spec: {
            resourceQuota: {
              limit: {
                limitsCpu: '2000m',
                extended:  {
                  'requests.nvidia.com/gpu': '4',
                  'example.com/fpga':        '2'
                }
              }
            },
            namespaceDefaultResourceQuota: { limit: {} }
          }
        })
      });

      expect(wrapper.vm.projectResourceQuotaLimits).toStrictEqual({
        limitsCpu:                          '2000m',
        'extended.requests.nvidia.com/gpu': '4',
        'extended.example.com/fpga':        '2'
      });
    });

    it('returns an empty object when limit is empty', () => {
      const wrapper: any = createWrapper();

      expect(wrapper.vm.projectResourceQuotaLimits).toStrictEqual({});
    });

    it('flattens an extended resource whose identifier itself starts with "extended."', () => {
      const wrapper: any = createWrapper({
        project: makeProject({
          spec: {
            resourceQuota:                 { limit: { extended: { 'extended.nvidia.com/gpu': '4' } } },
            namespaceDefaultResourceQuota: { limit: {} }
          }
        })
      });

      expect(wrapper.vm.projectResourceQuotaLimits).toStrictEqual({ 'extended.extended.nvidia.com/gpu': '4' });
    });

    it('returns an empty object when resourceQuota is not set on the project', () => {
      const wrapper: any = createWrapper({
        project: makeProject({
          spec: {
            resourceQuota:                 undefined,
            namespaceDefaultResourceQuota: { limit: {} }
          }
        })
      });

      expect(wrapper.vm.projectResourceQuotaLimits).toStrictEqual({});
    });
  });

  describe('computed: namespaceResourceQuotaLimits', () => {
    it('passes standard quota keys through and preserves namespace id', () => {
      const wrapper: any = createWrapper({
        project: makeProject({
          namespaces: [
            { id: 'ns1', resourceQuota: { limit: { limitsCpu: '500m' } } }
          ]
        })
      });

      expect(wrapper.vm.namespaceResourceQuotaLimits).toStrictEqual([
        { id: 'ns1', limitsCpu: '500m' }
      ]);
    });

    it('flattens extended resources for each namespace', () => {
      const wrapper: any = createWrapper({
        project: makeProject({
          namespaces: [
            { id: 'ns1', resourceQuota: { limit: { extended: { 'requests.nvidia.com/gpu': '2' } } } }
          ]
        })
      });

      expect(wrapper.vm.namespaceResourceQuotaLimits).toStrictEqual([
        { id: 'ns1', 'extended.requests.nvidia.com/gpu': '2' }
      ]);
    });

    it('handles multiple namespaces with a mix of standard and extended keys', () => {
      const wrapper: any = createWrapper({
        project: makeProject({
          namespaces: [
            { id: 'ns1', resourceQuota: { limit: { limitsCpu: '500m' } } },
            { id: 'ns2', resourceQuota: { limit: { extended: { 'requests.nvidia.com/gpu': '1' } } } }
          ]
        })
      });

      expect(wrapper.vm.namespaceResourceQuotaLimits).toHaveLength(2);
      expect(wrapper.vm.namespaceResourceQuotaLimits[0]).toStrictEqual({ id: 'ns1', limitsCpu: '500m' });
      expect(wrapper.vm.namespaceResourceQuotaLimits[1]).toStrictEqual({ id: 'ns2', 'extended.requests.nvidia.com/gpu': '1' });
    });

    it('returns an empty array when the project has no namespaces', () => {
      const wrapper: any = createWrapper();

      expect(wrapper.vm.namespaceResourceQuotaLimits).toStrictEqual([]);
    });
  });

  describe('computed: defaultResourceQuotaLimits', () => {
    it('passes standard quota keys through unchanged', () => {
      const wrapper: any = createWrapper({
        project: makeProject({
          spec: {
            resourceQuota:                 { limit: {} },
            namespaceDefaultResourceQuota: { limit: { limitsCpu: '1000m' } }
          }
        })
      });

      expect(wrapper.vm.defaultResourceQuotaLimits).toStrictEqual({ limitsCpu: '1000m' });
    });

    it('flattens extended quota keys', () => {
      const wrapper: any = createWrapper({
        project: makeProject({
          spec: {
            resourceQuota:                 { limit: {} },
            namespaceDefaultResourceQuota: { limit: { extended: { 'requests.nvidia.com/gpu': '2' } } }
          }
        })
      });

      expect(wrapper.vm.defaultResourceQuotaLimits).toStrictEqual({ 'extended.requests.nvidia.com/gpu': '2' });
    });

    it('returns an empty object when the namespaceDefaultResourceQuota limit is missing', () => {
      const wrapper: any = createWrapper({
        project: makeProject({
          spec: {
            resourceQuota:                 { limit: {} },
            namespaceDefaultResourceQuota: {}
          }
        })
      });

      expect(wrapper.vm.defaultResourceQuotaLimits).toStrictEqual({});
    });
  });

  describe('computed: editableLimits', () => {
    it('returns standard keys for standard quota types', () => {
      const wrapper: any = createWrapper({
        project: makeProject({
          spec: {
            resourceQuota:                 { limit: { limitsCpu: '2000m', configMaps: '10' } },
            namespaceDefaultResourceQuota: { limit: {} }
          }
        })
      });

      expect(wrapper.vm.editableLimits).toStrictEqual(['limitsCpu', 'configMaps']);
    });

    it('returns dotted keys for extended quota types', () => {
      const wrapper: any = createWrapper({
        project: makeProject({
          spec: {
            resourceQuota:                 { limit: { extended: { 'requests.nvidia.com/gpu': '4' } } },
            namespaceDefaultResourceQuota: { limit: {} }
          }
        })
      });

      expect(wrapper.vm.editableLimits).toStrictEqual(['extended.requests.nvidia.com/gpu']);
    });

    it('returns an empty array when there are no project quota limits', () => {
      const wrapper: any = createWrapper();

      expect(wrapper.vm.editableLimits).toStrictEqual([]);
    });
  });

  describe('method: update', () => {
    it('sets standard keys directly on the limit object', () => {
      const value = { resourceQuota: { limit: { limitsCpu: '1000m' } } };
      const wrapper: any = createWrapper({ value });

      wrapper.vm.update('configMaps', '20');

      expect(value.resourceQuota.limit).toMatchObject({ configMaps: '20', limitsCpu: '1000m' });
    });

    it('writes an extended key into the nested limit.extended object', () => {
      const value = { resourceQuota: { limit: {} } };
      const wrapper: any = createWrapper({ value });

      wrapper.vm.update('extended.requests.nvidia.com/gpu', '4');

      expect(value.resourceQuota).toStrictEqual({ limit: { extended: { 'requests.nvidia.com/gpu': '4' } } });
    });

    it('merges a new extended key with existing extended entries', () => {
      const value = { resourceQuota: { limit: { extended: { 'requests.nvidia.com/gpu': '2' } } } };
      const wrapper: any = createWrapper({ value });

      wrapper.vm.update('extended.example.com/fpga', '1');

      expect(value.resourceQuota.limit.extended).toStrictEqual({
        'requests.nvidia.com/gpu': '2',
        'example.com/fpga':        '1'
      });
    });

    it('overwrites an existing extended key with the new value', () => {
      const value = { resourceQuota: { limit: { extended: { 'requests.nvidia.com/gpu': '2' } } } };
      const wrapper: any = createWrapper({ value });

      wrapper.vm.update('extended.requests.nvidia.com/gpu', '8');

      expect(value.resourceQuota.limit.extended).toStrictEqual({ 'requests.nvidia.com/gpu': '8' });
    });

    it('does not affect existing standard keys when setting an extended key', () => {
      const value = { resourceQuota: { limit: { limitsCpu: '2000m' } } };
      const wrapper: any = createWrapper({ value });

      wrapper.vm.update('extended.requests.nvidia.com/gpu', '4');

      expect((value.resourceQuota.limit as any).limitsCpu).toBe('2000m');
    });

    it('correctly round-trips an extended resource whose identifier starts with "extended."', () => {
      const value = { resourceQuota: { limit: {} } };
      const wrapper: any = createWrapper({ value });

      wrapper.vm.update('extended.extended.nvidia.com/gpu', '4');

      expect(value.resourceQuota.limit).toStrictEqual({ extended: { 'extended.nvidia.com/gpu': '4' } });
    });

    it('does not write an extended entry into the standard keys when updating a standard key', () => {
      const value = { resourceQuota: { limit: {} } };
      const wrapper: any = createWrapper({ value });

      wrapper.vm.update('limitsCpu', '500m');

      expect((value.resourceQuota.limit as any).extended).toBeUndefined();
      expect((value.resourceQuota.limit as any).limitsCpu).toBe('500m');
    });
  });
});
