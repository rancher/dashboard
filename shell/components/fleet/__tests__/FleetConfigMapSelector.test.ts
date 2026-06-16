import { shallowMount } from '@vue/test-utils';
import { _EDIT } from '@shell/config/query-params';
import FleetConfigMapSelector from '@shell/components/fleet/FleetConfigMapSelector.vue';
import ResourceLabeledSelect from '@shell/components/form/ResourceLabeledSelect.vue';

describe('fleetConfigMapSelector.vue', () => {
  const defaultProps = {
    value:     {},
    namespace: 'fleet-default',
    inStore:   'management',
    mode:      _EDIT,
    label:     'Config Map',
  };

  const global = {
    stubs: { ResourceLabeledSelect },
    mocks: {
      $fetchState: { pending: false },
      $store:      { getters: { 'management/all': () => [] } },
    },
  };

  it('should emit update:value when update is called', async() => {
    const wrapper = shallowMount(FleetConfigMapSelector, {
      props: defaultProps,
      global,
    });

    const vm = wrapper.vm as any;

    await vm.update('cm1');

    expect(wrapper.emitted('update:value')).toBeTruthy();
    expect(wrapper.emitted('update:value')?.[0]).toStrictEqual(['cm1']);
  });

  it('should correctly map configMaps', () => {
    const wrapper = shallowMount(FleetConfigMapSelector, {
      props: defaultProps,
      global
    });

    const configMapsList = [
      {
        id: '1', name: 'cm1', namespace: 'fleet-default'
      },
      { name: 'cm2', namespace: 'fleet-default' }
    ];

    const vm = wrapper.vm as any;
    const result = vm.mapConfigMaps(configMapsList);

    expect(result).toStrictEqual([
      { label: 'cm1', value: 'cm1' },
      { name: 'cm2', namespace: 'fleet-default' }
    ]);
  });

  it('should return correct filter options from paginatePageOptions', () => {
    const wrapper = shallowMount(FleetConfigMapSelector, {
      props: defaultProps,
      global
    });

    const opts = { opts: { filter: 'test' } };

    const vm = wrapper.vm as any;
    const result = vm.paginatePageOptions(opts);

    expect(result.filters).toHaveLength(2);
    expect(result.groupByNamespace).toStrictEqual(false);
    expect(result.classify).toStrictEqual(true);
    expect(result.sort).toStrictEqual([{ asc: true, field: 'metadata.name' }]);
  });

  it('should correctly filter and map configMaps in allConfigMapsSettings.updateResources', () => {
    const wrapper = shallowMount(FleetConfigMapSelector, {
      props: defaultProps,
      global
    });

    const configMapsList = [
      {
        id: '1', name: 'cm1', namespace: 'fleet-default'
      },
      {
        id: '2', name: 'cm2', namespace: 'other'
      }
    ];

    const vm = wrapper.vm as any;

    const result = vm.allConfigMapsSettings.updateResources(configMapsList);

    expect(result).toStrictEqual([{ label: 'cm1', value: 'cm1' }]);
    expect(vm.configMaps).toStrictEqual([{
      id: '1', name: 'cm1', namespace: 'fleet-default'
    }]);
  });

  it('should correctly map configMaps in paginateConfigMapsSetting.updateResources', () => {
    const wrapper = shallowMount(FleetConfigMapSelector, {
      props: defaultProps,
      global
    });

    const configMapsList = [
      {
        id: '1', name: 'cm1', namespace: 'fleet-default'
      },
      {
        id: '2', name: 'cm2', namespace: 'fleet-default'
      }
    ];

    const vm = wrapper.vm as any;
    const result = vm.paginateConfigMapsSetting.updateResources(configMapsList);

    expect(result).toStrictEqual([
      { label: 'cm1', value: 'cm1' },
      { label: 'cm2', value: 'cm2' }
    ]);
    expect(vm.configMaps).toStrictEqual(configMapsList);
  });
});
