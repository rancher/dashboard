import { shallowMount } from '@vue/test-utils';
import ResourceStatusCards from '@shell/pages/c/_cluster/explorer/resource-status/ResourceStatusCards.vue';
import ResourceStatusWidgetGroup from '@shell/components/ResourceStatusWidget/ResourceStatusWidgetGroup.vue';

jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string) => `%${ key }%` }) }));

jest.mock('vuex', () => ({ useStore: () => ({}) }));

function groupConfig() {
  return shallowMount(ResourceStatusCards).findComponent(ResourceStatusWidgetGroup).props('config');
}

describe('component: ResourceStatusCards', () => {
  it('should render the cards container', () => {
    const wrapper = shallowMount(ResourceStatusCards);

    expect(wrapper.find('[data-testid="cluster-dashboard-resource-status"]').exists()).toStrictEqual(true);
  });

  it('should render the cards as a group without a title', () => {
    expect(groupConfig().title).toStrictEqual(undefined);
  });

  it('should render three widgets', () => {
    expect(groupConfig().widgets).toHaveLength(3);
  });

  it('should render the nodes card first', () => {
    expect(groupConfig().widgets[0]).toStrictEqual({ kind: 'summary', resource: 'node' });
  });

  it('should render the deployments card second', () => {
    expect(groupConfig().widgets[1]).toStrictEqual({ kind: 'summary', resource: 'apps.deployment' });
  });

  it('should render the unhealthy workloads card last, with every workload type except deployments', () => {
    expect(groupConfig().widgets[2]).toStrictEqual({
      kind:      'breakdown',
      title:     '%clusterIndexPage.resourceStatus.unhealthy.title%',
      resources: ['batch.cronjob', 'apps.daemonset', 'batch.job', 'apps.replicaset', 'apps.statefulset', 'pod'],
      colors:    ['error', 'warning'],
    });
  });
});
