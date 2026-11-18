import { shallowMount } from '@vue/test-utils';
import Project from '@shell/components/form/ResourceQuota/Project.vue';
import ResourceQuotaEntry from '@shell/components/form/ResourceQuota/ResourceQuotaEntry.vue';
import { TYPES } from '@shell/components/form/ResourceQuota/shared';

describe('project', () => {
  const defaultProps = {
    mode:  'create',
    value: {
      spec: {
        resourceQuota:                 { limit: {} },
        namespaceDefaultResourceQuota: { limit: {} }
      }
    },
    types: []
  };

  describe('created() spec parser', () => {
    it('should initialise resourceQuotas as an empty array when spec limits are empty', () => {
      const wrapper: any = shallowMount(Project, { props: defaultProps });

      expect(wrapper.vm.resourceQuotas).toStrictEqual([]);
    });

    it('should parse a standard resource type from the spec into resourceQuotas', () => {
      const wrapper: any = shallowMount(Project, {
        props: {
          ...defaultProps,
          value: {
            spec: {
              resourceQuota:                 { limit: { configMaps: '20' } },
              namespaceDefaultResourceQuota: { limit: { configMaps: '10' } }
            }
          }
        }
      });

      expect(wrapper.vm.resourceQuotas).toHaveLength(1);
      expect(wrapper.vm.resourceQuotas[0]).toMatchObject({
        resourceType:          'configMaps',
        resourceIdentifier:    'configMaps',
        projectLimit:          '20',
        namespaceDefaultLimit: '10',
      });
    });

    it('should parse an extended resource type from the spec into resourceQuotas', () => {
      const wrapper: any = shallowMount(Project, {
        props: {
          ...defaultProps,
          value: {
            spec: {
              resourceQuota:                 { limit: { extended: { test1: '10' } } },
              namespaceDefaultResourceQuota: { limit: { extended: { test1: '5' } } }
            }
          }
        }
      });

      expect(wrapper.vm.resourceQuotas).toHaveLength(1);
      expect(wrapper.vm.resourceQuotas[0]).toMatchObject({
        resourceType:          TYPES.EXTENDED,
        resourceIdentifier:    'test1',
        projectLimit:          '10',
        namespaceDefaultLimit: '5',
      });
    });

    it('should initialise resourceQuotas as an empty array when resourceQuota exists but has no limit property', () => {
      const wrapper: any = shallowMount(Project, {
        props: {
          ...defaultProps,
          value: {
            spec: {
              resourceQuota:                 {},
              namespaceDefaultResourceQuota: { limit: {} }
            }
          }
        }
      });

      expect(wrapper.vm.resourceQuotas).toStrictEqual([]);
    });

    it('should parse project quotas and fall back to empty string for missing ns limits when namespaceDefaultResourceQuota has no limit property', () => {
      const wrapper: any = shallowMount(Project, {
        props: {
          ...defaultProps,
          value: {
            spec: {
              resourceQuota:                 { limit: { configMaps: '20' } },
              namespaceDefaultResourceQuota: {}
            }
          }
        }
      });

      expect(wrapper.vm.resourceQuotas).toHaveLength(1);
      expect(wrapper.vm.resourceQuotas[0]).toMatchObject({
        resourceType:          'configMaps',
        projectLimit:          '20',
        namespaceDefaultLimit: '',
      });
    });

    it('should parse both standard and extended resource types into resourceQuotas', () => {
      const wrapper: any = shallowMount(Project, {
        props: {
          ...defaultProps,
          value: {
            spec: {
              resourceQuota:                 { limit: { configMaps: '20', extended: { test1: '10' } } },
              namespaceDefaultResourceQuota: { limit: { configMaps: '15', extended: { test1: '8' } } }
            }
          }
        }
      });

      expect(wrapper.vm.resourceQuotas).toHaveLength(2);
    });
  });

  describe('specFromQuotas()', () => {
    it('should convert a standard resourceQuota entry to projectLimit and nsLimit', () => {
      const wrapper: any = shallowMount(Project, { props: defaultProps });

      wrapper.setData({
        resourceQuotas: [{
          id:                    '1',
          resourceType:          'configMaps',
          resourceIdentifier:    'configMaps',
          projectLimit:          '20',
          namespaceDefaultLimit: '10',
        }]
      });

      expect(wrapper.vm.specFromQuotas()).toStrictEqual({
        projectLimit: { configMaps: '20' },
        nsLimit:      { configMaps: '10' },
      });
    });

    it('should convert an extended resourceQuota entry to a nested extended object', () => {
      const wrapper: any = shallowMount(Project, { props: defaultProps });

      wrapper.setData({
        resourceQuotas: [{
          id:                    '1',
          resourceType:          TYPES.EXTENDED,
          resourceIdentifier:    'my-resource',
          projectLimit:          '5',
          namespaceDefaultLimit: '3',
        }]
      });

      expect(wrapper.vm.specFromQuotas()).toStrictEqual({
        projectLimit: { extended: { 'my-resource': '5' } },
        nsLimit:      { extended: { 'my-resource': '3' } },
      });
    });

    it('should omit an extended entry from the spec when resourceIdentifier is empty', () => {
      const wrapper: any = shallowMount(Project, { props: defaultProps });

      wrapper.setData({
        resourceQuotas: [{
          id:                    '1',
          resourceType:          TYPES.EXTENDED,
          resourceIdentifier:    '',
          projectLimit:          '5',
          namespaceDefaultLimit: '3',
        }]
      });

      const { projectLimit } = wrapper.vm.specFromQuotas();

      expect(projectLimit.extended).toBeUndefined();
    });
  });

  describe('remainingTypes()', () => {
    const typesProps = [
      {
        value:          TYPES.EXTENDED,
        inputExponent:  0,
        baseUnit:       '',
        labelKey:       'resourceQuota.custom',
        placeholderKey: 'resourceQuota.projectLimit.unitlessPlaceholder'
      },
      {
        value:          'configMaps',
        inputExponent:  0,
        baseUnit:       '',
        labelKey:       'resourceQuota.configMaps',
        placeholderKey: 'resourceQuota.projectLimit.unitlessPlaceholder'
      },
      {
        value:          'pods',
        inputExponent:  0,
        baseUnit:       '',
        labelKey:       'resourceQuota.pods',
        placeholderKey: 'resourceQuota.projectLimit.unitlessPlaceholder'
      }
    ];

    it('should exclude already-used non-extended types', () => {
      const wrapper: any = shallowMount(Project, { props: { ...defaultProps, types: typesProps } });

      wrapper.setData({
        resourceQuotas: [{
          id:                    '1',
          resourceType:          'configMaps',
          resourceIdentifier:    'configMaps',
          projectLimit:          '20',
          namespaceDefaultLimit: '10',
        }]
      });

      const values = wrapper.vm.remainingTypes('pods').map((t: any) => t.value);

      expect(values).not.toContain('configMaps');
      expect(values).toContain('pods');
      expect(values).toContain(TYPES.EXTENDED);
    });

    it('should include the currentType even if it is already used', () => {
      const wrapper: any = shallowMount(Project, { props: { ...defaultProps, types: typesProps } });

      wrapper.setData({
        resourceQuotas: [{
          id:                    '1',
          resourceType:          'configMaps',
          resourceIdentifier:    'configMaps',
          projectLimit:          '20',
          namespaceDefaultLimit: '10',
        }]
      });

      const values = wrapper.vm.remainingTypes('configMaps').map((t: any) => t.value);

      expect(values).toContain('configMaps');
    });

    it('should always include extended type', () => {
      const wrapper: any = shallowMount(Project, { props: { ...defaultProps, types: typesProps } });

      const values = wrapper.vm.remainingTypes('pods').map((t: any) => t.value);

      expect(values).toContain(TYPES.EXTENDED);
    });
  });

  describe('validationChanged watcher', () => {
    it('should emit validationChanged with false when an extended quota has no resource identifier', async() => {
      const wrapper: any = shallowMount(Project, { props: defaultProps });

      await wrapper.setData({
        resourceQuotas: [{
          id:                    '1',
          resourceType:          TYPES.EXTENDED,
          resourceIdentifier:    '',
          projectLimit:          '5',
          namespaceDefaultLimit: '3',
        }]
      });

      const emitted = wrapper.emitted('validationChanged');

      expect(emitted).toBeTruthy();
      expect(emitted[emitted.length - 1]).toStrictEqual([false]);
    });

    it('should emit validationChanged with true when all extended quotas have resource identifiers', async() => {
      const wrapper: any = shallowMount(Project, { props: defaultProps });

      await wrapper.setData({
        resourceQuotas: [{
          id:                    '1',
          resourceType:          TYPES.EXTENDED,
          resourceIdentifier:    'my-resource',
          projectLimit:          '5',
          namespaceDefaultLimit: '3',
        }]
      });

      const emitted = wrapper.emitted('validationChanged');

      expect(emitted).toBeTruthy();
      expect(emitted[emitted.length - 1]).toStrictEqual([true]);
    });

    it('should emit validationChanged with true when resourceQuotas has no extended entries', async() => {
      const wrapper: any = shallowMount(Project, { props: defaultProps });

      await wrapper.setData({
        resourceQuotas: [{
          id:                    '1',
          resourceType:          'configMaps',
          resourceIdentifier:    'configMaps',
          projectLimit:          '20',
          namespaceDefaultLimit: '10',
        }]
      });

      const emitted = wrapper.emitted('validationChanged');

      expect(emitted).toBeTruthy();
      expect(emitted[emitted.length - 1]).toStrictEqual([true]);
    });

    it('should emit validationChanged with false when two extended quotas share a resource identifier', async() => {
      const wrapper: any = shallowMount(Project, { props: defaultProps });

      await wrapper.setData({
        resourceQuotas: [
          {
            id:                    '1',
            resourceType:          TYPES.EXTENDED,
            resourceIdentifier:    'requests.nvidia.com/gpu',
            projectLimit:          '5',
            namespaceDefaultLimit: '3',
          },
          {
            id:                    '2',
            resourceType:          TYPES.EXTENDED,
            resourceIdentifier:    'requests.nvidia.com/gpu',
            projectLimit:          '10',
            namespaceDefaultLimit: '6',
          }
        ]
      });

      const emitted = wrapper.emitted('validationChanged');

      expect(emitted).toBeTruthy();
      expect(emitted[emitted.length - 1]).toStrictEqual([false]);
    });

    it('should emit validationChanged with true once a duplicate resource identifier is renamed', async() => {
      const wrapper: any = shallowMount(Project, { props: defaultProps });

      await wrapper.setData({
        resourceQuotas: [
          {
            id:                    '1',
            resourceType:          TYPES.EXTENDED,
            resourceIdentifier:    'requests.nvidia.com/gpu',
            projectLimit:          '5',
            namespaceDefaultLimit: '3',
          },
          {
            id:                    '2',
            resourceType:          TYPES.EXTENDED,
            resourceIdentifier:    'requests.nvidia.com/gpu',
            projectLimit:          '10',
            namespaceDefaultLimit: '6',
          }
        ]
      });

      wrapper.vm.resourceQuotas[1].resourceIdentifier = 'requests.amd.com/gpu';
      await wrapper.vm.$nextTick();

      const emitted = wrapper.emitted('validationChanged');

      expect(emitted[emitted.length - 1]).toStrictEqual([true]);
    });
  });

  describe('duplicateIdentifiers', () => {
    const extendedQuota = (id: string, resourceIdentifier: string) => ({
      id,
      resourceType:          TYPES.EXTENDED,
      resourceIdentifier,
      projectLimit:          '5',
      namespaceDefaultLimit: '3',
    });

    it.each([
      ['unique extended identifiers', [extendedQuota('1', 'gpu'), extendedQuota('2', 'fpga')], []],
      ['a shared extended identifier', [extendedQuota('1', 'gpu'), extendedQuota('2', 'gpu')], ['gpu']],
      ['an identifier shared by three rows', [extendedQuota('1', 'gpu'), extendedQuota('2', 'gpu'), extendedQuota('3', 'gpu')], ['gpu']],
      ['empty extended identifiers', [extendedQuota('1', ''), extendedQuota('2', '')], []],
      ['identifiers differing only in case', [extendedQuota('1', 'gpu'), extendedQuota('2', 'GPU')], []],
      ['a standard type matching an extended identifier', [
        {
          id:                    '1',
          resourceType:          'configMaps',
          resourceIdentifier:    'configMaps',
          projectLimit:          '20',
          namespaceDefaultLimit: '10',
        },
        extendedQuota('2', 'configMaps')
      ], []],
    ])('should handle %s', async(_, resourceQuotas, expected) => {
      const wrapper: any = shallowMount(Project, { props: defaultProps });

      await wrapper.setData({ resourceQuotas });

      expect(wrapper.vm.duplicateIdentifiers).toStrictEqual(expected);
    });

    it('should mark only the rows that share an identifier as duplicate', async() => {
      const wrapper: any = shallowMount(Project, { props: defaultProps });

      await wrapper.setData({
        resourceQuotas: [
          extendedQuota('1', 'gpu'),
          extendedQuota('2', 'fpga'),
          extendedQuota('3', 'gpu'),
        ]
      });

      const rows = wrapper.findAllComponents(ResourceQuotaEntry as any);

      expect(rows.map((row: any) => row.props('duplicate'))).toStrictEqual([true, false, true]);
    });
  });
});
