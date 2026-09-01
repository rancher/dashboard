import { shallowMount } from '@vue/test-utils';
import NamespaceRow from '@shell/components/form/ResourceQuota/NamespaceRow.vue';

describe('namespaceRow', () => {
  const storeMock = { getters: { 'i18n/t': (key: string) => key } };

  const standardType = {
    value:         'limitsCpu',
    inputExponent: -1,
    baseUnit:      '',
    placeholder:   'Enter CPU',
    increment:     1,
  };

  const extendedType = {
    value:         'extended',
    inputExponent: 0,
    baseUnit:      '',
    placeholder:   'Enter value',
    increment:     1,
  };

  const defaultProps = {
    mode:                         'edit',
    type:                         'limitsCpu',
    types:                        [standardType, extendedType],
    value:                        { limit: { limitsCpu: '1000m' } },
    namespace:                    { id: 'test-ns' },
    projectResourceQuotaLimits:   { limitsCpu: '2000m' },
    namespaceResourceQuotaLimits: [],
    defaultResourceQuotaLimits:   { limitsCpu: '500m' },
  };

  const createWrapper = (propsOverrides: Record<string, unknown> = {}) => {
    return shallowMount(NamespaceRow, {
      props:  { ...defaultProps, ...propsOverrides },
      global: { mocks: { $store: storeMock } },
    });
  };

  describe('computed: displayType', () => {
    it('returns the type unchanged for standard quota types', () => {
      const wrapper: any = createWrapper({ type: 'limitsCpu' });

      expect(wrapper.vm.displayType).toBe('limitsCpu');
    });

    it('strips the "extended." prefix for extended quota types', () => {
      const wrapper: any = createWrapper({
        type:                         'extended.requests.nvidia.com/gpu',
        value:                        { limit: { extended: { 'requests.nvidia.com/gpu': '4' } } },
        projectResourceQuotaLimits:   { 'extended.requests.nvidia.com/gpu': '8' },
        defaultResourceQuotaLimits:   { 'extended.requests.nvidia.com/gpu': '2' },
        namespaceResourceQuotaLimits: [],
      });

      expect(wrapper.vm.displayType).toBe('requests.nvidia.com/gpu');
    });

    it('strips only the leading "extended." when the resource identifier itself starts with "extended."', () => {
      const wrapper: any = createWrapper({
        type:                         'extended.extended.nvidia.com/gpu',
        value:                        { limit: { extended: { 'extended.nvidia.com/gpu': '4' } } },
        projectResourceQuotaLimits:   { 'extended.extended.nvidia.com/gpu': '8' },
        defaultResourceQuotaLimits:   { 'extended.extended.nvidia.com/gpu': '2' },
        namespaceResourceQuotaLimits: [],
      });

      expect(wrapper.vm.displayType).toBe('extended.nvidia.com/gpu');
    });
  });

  describe('computed: currentLimit', () => {
    it('returns the limit value for a standard quota type', () => {
      const wrapper: any = createWrapper({
        type:  'limitsCpu',
        value: { limit: { limitsCpu: '1000m' } },
      });

      expect(wrapper.vm.currentLimit).toBe('1000m');
    });

    it('returns undefined when the standard type key is absent from limit', () => {
      const wrapper: any = createWrapper({
        type:  'limitsCpu',
        value: { limit: {} },
      });

      expect(wrapper.vm.currentLimit).toBeUndefined();
    });

    it('reads the value from limit.extended for an extended quota type', () => {
      const wrapper: any = createWrapper({
        type:                         'extended.requests.nvidia.com/gpu',
        value:                        { limit: { extended: { 'requests.nvidia.com/gpu': '4' } } },
        projectResourceQuotaLimits:   { 'extended.requests.nvidia.com/gpu': '8' },
        defaultResourceQuotaLimits:   { 'extended.requests.nvidia.com/gpu': '2' },
        namespaceResourceQuotaLimits: [],
      });

      expect(wrapper.vm.currentLimit).toBe('4');
    });

    it('returns undefined when limit.extended is absent for an extended quota type', () => {
      const wrapper: any = createWrapper({
        type:                         'extended.requests.nvidia.com/gpu',
        value:                        { limit: {} },
        projectResourceQuotaLimits:   { 'extended.requests.nvidia.com/gpu': '8' },
        defaultResourceQuotaLimits:   { 'extended.requests.nvidia.com/gpu': '2' },
        namespaceResourceQuotaLimits: [],
      });

      expect(wrapper.vm.currentLimit).toBeUndefined();
    });

    it('reads the correct value when the resource identifier itself starts with "extended."', () => {
      const wrapper: any = createWrapper({
        type:                         'extended.extended.nvidia.com/gpu',
        value:                        { limit: { extended: { 'extended.nvidia.com/gpu': '4' } } },
        projectResourceQuotaLimits:   { 'extended.extended.nvidia.com/gpu': '8' },
        defaultResourceQuotaLimits:   { 'extended.extended.nvidia.com/gpu': '2' },
        namespaceResourceQuotaLimits: [],
      });

      expect(wrapper.vm.currentLimit).toBe('4');
    });

    it('returns undefined when the extended resource identifier is not in limit.extended', () => {
      const wrapper: any = createWrapper({
        type:                         'extended.requests.nvidia.com/gpu',
        value:                        { limit: { extended: { 'example.com/fpga': '1' } } },
        projectResourceQuotaLimits:   { 'extended.requests.nvidia.com/gpu': '8' },
        defaultResourceQuotaLimits:   { 'extended.requests.nvidia.com/gpu': '2' },
        namespaceResourceQuotaLimits: [],
      });

      expect(wrapper.vm.currentLimit).toBeUndefined();
    });

    it.each([
      ['limitsCpu', { limitsCpu: '500m' }, '500m'],
      ['configMaps', { configMaps: '10' }, '10'],
      ['pods', { pods: '20' }, '20'],
    ])('returns the correct value for standard type "%s"', (type, limit, expected) => {
      const wrapper: any = createWrapper({
        type,
        types: [
          {
            value: type, inputExponent: 0, baseUnit: '', placeholder: '', increment: 1
          },
          extendedType,
        ],
        value:                      { limit },
        projectResourceQuotaLimits: { [type]: '100' },
        defaultResourceQuotaLimits: { [type]: '0' },
      });

      expect(wrapper.vm.currentLimit).toBe(expected);
    });
  });

  describe('mounted(): initial value emission', () => {
    it('emits update:value on mount with the type as the first argument', () => {
      const wrapper: any = createWrapper({
        type:  'limitsCpu',
        value: { limit: { limitsCpu: '1000m' } },
      });

      const emitted = wrapper.emitted('update:value');

      expect(emitted).toBeTruthy();
      expect(emitted![0][0]).toBe('limitsCpu');
    });

    it('emits update:value on mount when currentLimit is not set, using defaultResourceQuotaLimits', () => {
      const wrapper: any = createWrapper({
        type:                       'limitsCpu',
        value:                      { limit: {} },
        projectResourceQuotaLimits: { limitsCpu: '2000m' },
        defaultResourceQuotaLimits: { limitsCpu: '500m' },
      });

      const emitted = wrapper.emitted('update:value');

      expect(emitted).toBeTruthy();
      expect(emitted![0][0]).toBe('limitsCpu');
    });

    it('emits update:value on mount for an extended quota type', () => {
      const wrapper: any = createWrapper({
        type:                         'extended.requests.nvidia.com/gpu',
        value:                        { limit: { extended: { 'requests.nvidia.com/gpu': '4' } } },
        projectResourceQuotaLimits:   { 'extended.requests.nvidia.com/gpu': '8' },
        defaultResourceQuotaLimits:   { 'extended.requests.nvidia.com/gpu': '2' },
        namespaceResourceQuotaLimits: [],
      });

      const emitted = wrapper.emitted('update:value');

      expect(emitted).toBeTruthy();
      expect(emitted![0][0]).toBe('extended.requests.nvidia.com/gpu');
    });
  });

  describe('computed: totalContribution', () => {
    it('equals zero when currentLimit is 0 and no other namespaces contribute', () => {
      const wrapper: any = createWrapper({
        type:                         'limitsCpu',
        value:                        { limit: { limitsCpu: '0' } },
        projectResourceQuotaLimits:   { limitsCpu: '2000m' },
        namespaceResourceQuotaLimits: [],
        defaultResourceQuotaLimits:   { limitsCpu: '0' },
      });

      expect(wrapper.vm.totalContribution).toBe(0);
    });

    it('includes contributions from other namespaces alongside the current limit', () => {
      // ns2 contributes 500m, current namespace has 0
      const wrapper: any = createWrapper({
        type:                         'limitsCpu',
        value:                        { limit: { limitsCpu: '0' } },
        projectResourceQuotaLimits:   { limitsCpu: '2000m' },
        namespaceResourceQuotaLimits: [
          { id: 'ns2', limitsCpu: '500m' },
        ],
        defaultResourceQuotaLimits: { limitsCpu: '0' },
        namespace:                  { id: 'test-ns' },
      });

      // ns2's 500m contribution should be included
      expect(wrapper.vm.totalContribution).toBeGreaterThan(0);
    });

    it('uses currentLimit for the extended type in the total', () => {
      const wrapper: any = createWrapper({
        type:                         'extended.requests.nvidia.com/gpu',
        value:                        { limit: { extended: { 'requests.nvidia.com/gpu': '0' } } },
        projectResourceQuotaLimits:   { 'extended.requests.nvidia.com/gpu': '8' },
        namespaceResourceQuotaLimits: [],
        defaultResourceQuotaLimits:   { 'extended.requests.nvidia.com/gpu': '0' },
      });

      expect(wrapper.vm.totalContribution).toBe(0);
    });
  });

  describe('computed: namespaceLimits', () => {
    it('excludes the current namespace from the list', () => {
      const wrapper: any = createWrapper({
        type:                         'limitsCpu',
        value:                        { limit: { limitsCpu: '500m' } },
        projectResourceQuotaLimits:   { limitsCpu: '2000m' },
        namespaceResourceQuotaLimits: [
          { id: 'test-ns', limitsCpu: '500m' },
          { id: 'other-ns', limitsCpu: '300m' },
        ],
        namespace:                  { id: 'test-ns' },
        defaultResourceQuotaLimits: { limitsCpu: '0' },
      });

      // Only the other namespace should contribute
      expect(wrapper.vm.namespaceLimits).toHaveLength(1);
    });

    it('handles flattened extended keys from namespaceResourceQuotaLimits', () => {
      const wrapper: any = createWrapper({
        type:                         'extended.requests.nvidia.com/gpu',
        value:                        { limit: { extended: { 'requests.nvidia.com/gpu': '1' } } },
        projectResourceQuotaLimits:   { 'extended.requests.nvidia.com/gpu': '8' },
        namespaceResourceQuotaLimits: [
          { id: 'other-ns', 'extended.requests.nvidia.com/gpu': '2' },
        ],
        namespace:                  { id: 'test-ns' },
        defaultResourceQuotaLimits: { 'extended.requests.nvidia.com/gpu': '0' },
      });

      expect(wrapper.vm.namespaceLimits).toHaveLength(1);
    });
  });
});
