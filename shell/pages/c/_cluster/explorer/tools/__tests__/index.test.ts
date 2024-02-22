import { clone } from '@shell/utils/object';
import ClusterTools from '@shell/pages/c/_cluster/explorer/tools/index.vue';
import { shallowMount } from '@vue/test-utils';
import { cleanHtmlDirective } from '@shell/plugins/clean-html-directive';
import { MANAGEMENT } from '@shell/config/types';

const options = () => [
  {
    chart: {
      key:              'cluster/rancher-charts/rancher-alerting-drivers',
      type:             'chart',
      id:               'cluster/rancher-charts/rancher-alerting-drivers',
      certified:        'rancher',
      sideLabel:        null,
      repoType:         'cluster',
      repoName:         'rancher-charts',
      repoNameDisplay:  'Rancher',
      certifiedSort:    1,
      icon:             '',
      iconName:         'dot',
      color:            'rancher',
      chartType:        'cluster-tool',
      chartName:        'rancher-alerting-drivers',
      chartNameDisplay: 'Alerting Drivers',
      chartDescription: 'The manager for third-party webhook receivers used in Prometheus Alertmanager',
      repoKey:          '1',
      categories:       [
        'Monitoring'
      ],
    },
    app: {
      id:         'default/rancher-alerting-drivers',
      type:       'catalog.cattle.io.app',
      apiVersion: 'catalog.cattle.io/v1',
      kind:       'App',
      metadata:   {
        name:      'rancher-alerting-drivers',
        namespace: 'default',
      },
      spec: {
        chart:     { metadata: { name: 'rancher-alerting-drivers' } },
        name:      'rancher-alerting-drivers',
        namespace: 'default',
      },
    }
  }
];

describe('page: cluster tools', () => {
  const mountOptions = {
    directives: { cleanHtmlDirective },
    computed:   { options },
    mocks:      {
      $route:      { query: {} },
      $fetchState: {
        pending: false, error: true, timestamp: Date.now()
      },
      $store: {
        dispatch: (schema: string, opt: { type: string }) => {
          if (schema === 'management/findAll' && opt.type === MANAGEMENT.PROJECT) {
            return [];
          }
        },
        getters: {
          'features/get':         () => true,
          'management/schemaFor': (schema: string) => {
            if (schema === MANAGEMENT.PROJECT) {
              return true;
            }
          },
          currentCluster: { id: 'cluster', status: { provider: 'provider' } },
          'i18n/t':       jest.fn(),
        }
      }
    },
  };

  it('should show apps catalog', async() => {
    const wrapper = shallowMount(ClusterTools, mountOptions);

    await (ClusterTools as any).fetch.call(wrapper.vm);
    const cards = wrapper.find('[data-testid^="cluster-tools-app"]');

    expect(cards.exists()).toBe(true);
  });

  it('should show apps catalog when no permissions to `project` schema', async() => {
    const options = clone(mountOptions);

    options.mocks.$store.dispatch = (schema: string, opt: { type: string }) => {
      if (schema === 'management/findAll' && opt.type === MANAGEMENT.PROJECT) {
        return null;
      }
    };

    const wrapper = shallowMount(ClusterTools, options);

    await (ClusterTools as any).fetch.call(wrapper.vm);
    const cards = wrapper.find('[data-testid^="cluster-tools-app"]');

    expect(cards.exists()).toBe(true);
  });
});
