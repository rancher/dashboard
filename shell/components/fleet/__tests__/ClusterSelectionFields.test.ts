import { shallowMount } from '@vue/test-utils';
import ClusterSelectionFields from '@shell/components/fleet/FleetClusterTargets/ClusterSelectionFields.vue';
import ResourceLabeledSelect from '@shell/components/form/ResourceLabeledSelect.vue';
import { FLEET } from '@shell/config/types';
import { _EDIT, _VIEW } from '@shell/config/query-params';

describe('component: ClusterSelectionFields', () => {
  const defaultProps = {
    selectedClusters:      ['cluster-1'],
    selectedClusterGroups: [],
    clusterSelectors:      [],
    clusterGroupsOptions:  [],
    namespace:             'fleet-default',
    mode:                  _EDIT,
  };

  it('should match snapshot with default variant', () => {
    const wrapper = shallowMount(ClusterSelectionFields, { props: defaultProps });

    expect(wrapper.element).toMatchSnapshot();
  });

  it('should match snapshot with appco variant', () => {
    const wrapper = shallowMount(ClusterSelectionFields, { props: { ...defaultProps, variant: 'appco' } });

    expect(wrapper.element).toMatchSnapshot();
  });

  it('should emit select-clusters on cluster selection', () => {
    const wrapper = shallowMount(ClusterSelectionFields, { props: defaultProps });

    wrapper.findComponent('[data-testid="fleet-target-cluster-name-selector"]').vm.$emit('update:value', ['cluster-2']);

    expect(wrapper.emitted('select-clusters')?.[0]).toStrictEqual([['cluster-2']]);
  });

  it('should emit select-cluster-groups on group selection', () => {
    const wrapper = shallowMount(ClusterSelectionFields, { props: defaultProps });

    wrapper.findComponent('[data-testid="fleet-target-cluster-group-selector"]').vm.$emit('update:value', ['group-1']);

    expect(wrapper.emitted('select-cluster-groups')?.[0]).toStrictEqual([['group-1']]);
  });

  it('should emit add-match-expressions when add button is clicked', async() => {
    const wrapper = shallowMount(ClusterSelectionFields, { props: defaultProps });

    await wrapper.findComponent({ name: 'RcButton' }).vm.$emit('click');

    expect(wrapper.emitted('add-match-expressions')).toBeTruthy();
  });

  it('should render a paginated cluster select scoped to the management store', () => {
    const wrapper = shallowMount(ClusterSelectionFields, { props: defaultProps });

    const select = wrapper.findComponent(ResourceLabeledSelect);

    expect(select.props('resourceType')).toBe(FLEET.CLUSTER);
    expect(select.props('inStore')).toBe('management');
  });

  it('should map clusters to display-name options, filtered by namespace and harvester visibility', () => {
    const wrapper = shallowMount(ClusterSelectionFields, {
      props: {
        ...defaultProps, namespace: 'fleet-default', areHarvesterHostsVisible: false
      }
    });

    const { updateResources } = wrapper.findComponent(ResourceLabeledSelect).props('allResourcesSettings');

    const mapped = updateResources([
      {
        metadata: {
          namespace: 'fleet-default', name: 'c1', labels: { 'management.cattle.io/cluster-display-name': 'Prod' }
        }
      },
      { metadata: { namespace: 'other-namespace', name: 'c2' } },
      {
        metadata: {
          namespace: 'fleet-default', name: 'hv', labels: { 'provider.cattle.io': 'harvester' }
        }
      },
    ]);

    expect(mapped).toStrictEqual([{ label: 'Prod', value: 'Prod' }]);
  });

  it('should include harvester clusters when they are visible', () => {
    const wrapper = shallowMount(ClusterSelectionFields, {
      props: {
        ...defaultProps, namespace: 'fleet-default', areHarvesterHostsVisible: true
      }
    });

    const { updateResources } = wrapper.findComponent(ResourceLabeledSelect).props('allResourcesSettings');

    const mapped = updateResources([
      {
        metadata: {
          namespace: 'fleet-default', name: 'hv', labels: { 'provider.cattle.io': 'harvester' }
        }
      },
    ]);

    expect(mapped).toStrictEqual([{ label: 'hv', value: 'hv' }]);
  });

  it('should hide add button in view mode', () => {
    const wrapper = shallowMount(ClusterSelectionFields, {
      props: {
        ...defaultProps, mode: _VIEW, isView: true
      }
    });

    const addButtons = wrapper.findAllComponents({ name: 'RcButton' });

    expect(addButtons).toHaveLength(0);
  });
});
