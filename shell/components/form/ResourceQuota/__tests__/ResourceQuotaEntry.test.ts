import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ResourceQuotaEntry from '@shell/components/form/ResourceQuota/ResourceQuotaEntry.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { RcButton } from '@components/RcButton';
import { TYPES } from '@shell/components/form/ResourceQuota/shared';

describe('component: ResourceQuotaEntry', () => {
  const store = createStore({});

  const mockType = {
    value:         'configMaps',
    inputExponent: 0,
    baseUnit:      '',
    placeholder:   'Enter count',
    increment:     1,
  };

  const podsType = {
    value:         'pods',
    inputExponent: 0,
    baseUnit:      '',
    placeholder:   'Enter count',
    increment:     1,
  };

  const limitsCpuType = {
    value:         'limitsCpu',
    inputExponent: -1,
    baseUnit:      '',
    placeholder:   'Enter CPU',
    increment:     1,
  };

  const extendedType = {
    value:         TYPES.EXTENDED,
    inputExponent: 0,
    baseUnit:      '',
    placeholder:   'Enter value',
    increment:     1,
  };

  const allTypes = [mockType, podsType, limitsCpuType, extendedType];

  const defaultProps = {
    id:                    '1',
    mode:                  'edit',
    types:                 allTypes,
    resourceType:          'configMaps',
    resourceIdentifier:    'configMaps',
    projectLimit:          '20',
    namespaceDefaultLimit: '10',
  };

  const createWrapper = (propsOverrides: Record<string, unknown> = {}) => {
    return shallowMount(ResourceQuotaEntry, {
      props:  { ...defaultProps, ...propsOverrides },
      global: { provide: { store } },
    });
  };

  describe('rendering', () => {
    it('should render all input fields with their data-testid attributes', () => {
      const wrapper = createWrapper();

      expect(wrapper.find('[data-testid="projectrow-type-input"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="projectrow-custom-type-input"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="projectrow-project-quota-input"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="projectrow-namespace-quota-input"]').exists()).toBe(true);
    });
  });

  describe('computed: typeOption', () => {
    it('should return the matching type option for a given resourceType', () => {
      const wrapper = createWrapper({ resourceType: 'configMaps' });

      expect((wrapper.vm as any).typeOption).toStrictEqual(mockType);
    });

    it('should return the extended type option when resourceType is TYPES.EXTENDED', () => {
      const wrapper = createWrapper({ resourceType: TYPES.EXTENDED });

      expect((wrapper.vm as any).typeOption).toStrictEqual(extendedType);
    });
  });

  describe('computed: isCustom', () => {
    it('should return true when resourceType equals TYPES.EXTENDED', () => {
      const wrapper = createWrapper({ resourceType: TYPES.EXTENDED });

      expect((wrapper.vm as any).isCustom).toBe(true);
    });

    it.each([
      ['configMaps'],
      ['pods'],
      ['limitsCpu'],
    ])('should return false when resourceType is "%s"', (resourceType) => {
      const wrapper = createWrapper({ resourceType });

      expect((wrapper.vm as any).isCustom).toBe(false);
    });
  });

  describe('computed: customTypeRules', () => {
    it('should return an empty array when resourceType is a standard type', () => {
      const wrapper = createWrapper({ resourceType: 'configMaps' });

      expect((wrapper.vm as any).customTypeRules).toStrictEqual([]);
    });

    it('should return one validation rule when resourceType is TYPES.EXTENDED', () => {
      const wrapper = createWrapper({ resourceType: TYPES.EXTENDED });

      expect((wrapper.vm as any).customTypeRules).toHaveLength(1);
    });

    describe('validation rule behavior for custom type', () => {
      it.each([
        ['', 'resourceQuota.errors.customTypeRequired'],
        [null, 'resourceQuota.errors.customTypeRequired'],
        [undefined, 'resourceQuota.errors.customTypeRequired'],
      ])('should return an error message for falsy value "%s"', (value, expectedError) => {
        const wrapper = createWrapper({ resourceType: TYPES.EXTENDED });
        const [rule] = (wrapper.vm as any).customTypeRules;

        expect(rule(value)).toBe(expectedError);
      });

      it.each([
        ['my-resource'],
        ['cpu'],
        ['custom.resource/name'],
      ])('should return undefined for non-empty value "%s"', (value) => {
        const wrapper = createWrapper({ resourceType: TYPES.EXTENDED });
        const [rule] = (wrapper.vm as any).customTypeRules;

        expect(rule(value)).toBeUndefined();
      });
    });
  });

  describe('method: remove', () => {
    it('should emit remove event with the resource quota id', () => {
      const id = 'test-remove-id';
      const wrapper = createWrapper({ id });

      (wrapper.vm as any).remove(id);

      expect(wrapper.emitted('remove')).toBeTruthy();
      expect(wrapper.emitted('remove')![0]).toStrictEqual([id]);
    });

    it('should emit remove when the Remove button is clicked', async() => {
      const id = 'click-test-id';
      const wrapper = createWrapper({ id });

      await wrapper.findComponent(RcButton as any).trigger('click');

      expect(wrapper.emitted('remove')).toBeTruthy();
      expect(wrapper.emitted('remove')![0]).toStrictEqual([id]);
    });
  });

  describe('method: updateResourceIdentifier', () => {
    it('should emit update:resourceIdentifier with the new type for standard types', () => {
      const wrapper = createWrapper({ resourceType: 'configMaps' });

      (wrapper.vm as any).updateResourceIdentifier('pods');

      expect(wrapper.emitted('update:resourceIdentifier')).toBeTruthy();
      expect(wrapper.emitted('update:resourceIdentifier')![0]).toStrictEqual(['pods']);
    });

    it('should not emit update:resourceIdentifier when called with TYPES.EXTENDED', () => {
      const wrapper = createWrapper({ resourceType: TYPES.EXTENDED });

      (wrapper.vm as any).updateResourceIdentifier(TYPES.EXTENDED);

      expect(wrapper.emitted('update:resourceIdentifier')).toBeFalsy();
    });
  });

  describe('template: LabeledInput disabled state', () => {
    it('should have the identifier input disabled when resourceType is a standard type', () => {
      const wrapper = createWrapper({ resourceType: 'configMaps' });
      const input = wrapper.findComponent(LabeledInput as any);

      expect(input.props('disabled')).toBe(true);
    });

    it('should not have the identifier input disabled when resourceType is TYPES.EXTENDED', () => {
      const wrapper = createWrapper({ resourceType: TYPES.EXTENDED });
      const input = wrapper.findComponent(LabeledInput as any);

      expect(input.props('disabled')).toBe(false);
    });
  });

  describe('template: LabeledInput required state', () => {
    it('should have the identifier input required when resourceType is TYPES.EXTENDED', () => {
      const wrapper = createWrapper({ resourceType: TYPES.EXTENDED });
      const input = wrapper.findComponent(LabeledInput as any);

      expect(input.props('required')).toBe(true);
    });

    it('should not have the identifier input required when resourceType is a standard type', () => {
      const wrapper = createWrapper({ resourceType: 'configMaps' });
      const input = wrapper.findComponent(LabeledInput as any);

      expect(input.props('required')).toBe(false);
    });
  });
});
