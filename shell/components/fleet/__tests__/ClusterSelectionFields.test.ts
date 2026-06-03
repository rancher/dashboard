import { shallowMount } from '@vue/test-utils';
import ClusterSelectionFields from '@shell/components/fleet/FleetClusterTargets/ClusterSelectionFields.vue';
import { _EDIT, _VIEW } from '@shell/config/query-params';

describe('component: ClusterSelectionFields', () => {
  const defaultProps = {
    selectedClusters:      ['cluster-1'],
    selectedClusterGroups: [],
    clusterSelectors:      [],
    clustersOptions:       [{ label: 'cluster-1', value: 'cluster-1' }],
    clusterGroupsOptions:  [],
    mode:                  _EDIT,
  };

  it('should match snapshot with default variant', () => {
    const wrapper = shallowMount(ClusterSelectionFields, { props: defaultProps });

    expect(wrapper.element).toMatchSnapshot();
  });

  it('should match snapshot with appco variant', () => {
    const wrapper = shallowMount(ClusterSelectionFields, {
      props: { ...defaultProps, variant: 'appco' }
    });

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

  it('should hide add button in view mode', () => {
    const wrapper = shallowMount(ClusterSelectionFields, {
      props: { ...defaultProps, mode: _VIEW, isView: true }
    });

    const addButtons = wrapper.findAllComponents({ name: 'RcButton' });

    expect(addButtons.length).toStrictEqual(0);
  });
});
