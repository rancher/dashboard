import MacvlanSubnet from '../macvlan.cluster.cattle.io.macvlansubnet.vue';
import { mount } from '@vue/test-utils';
import { _CREATE } from '@shell/config/query-params';
import { cleanHtmlDirective } from '@shell/plugins/clean-html-directive';
import { cleanTooltipDirective } from '@shell/plugins/clean-tooltip-directive';

const emptyForm = {
  apiVersion: 'macvlan.cluster.cattle.io/v1',
  kind:       'MacvlanSubnet',
  metadata:   {
    name:      '',
    namespace: 'kube-system',
    labels:    { project: '' },
  },
  spec: {
    master:            '',
    vlan:              0,
    cidr:              '',
    mode:              'bridge',
    gateway:           '',
    ranges:            [],
    routes:            [],
    podDefaultGateway: {
      enable:      false,
      serviceCidr: ''
    }
  }
};

describe('macvlansubnet: edit', () => {
  it('should have input and select', () => {
    const wrapper = mount(MacvlanSubnet, {
      propsData:  { mode: _CREATE, value: {} },
      directives: { cleanTooltipDirective, cleanHtmlDirective },
      mocks:      {
        $router: { currentRoute: {}, replace: () => jest.fn() },
        $route:  { query: {}, hash: '#labels' },
        $store:  {
          getters: {
            'cluster/all':                () => [],
            'i18n/exists':                key => key,
            currentStore:                 () => 'cluster',
            'cluster/schemaFor':          () => ({ id: 'macvlan', name: 'macvlan' }),
            'i18n/t':                     t => t,
            'resource-fetch/refreshFlag': () => jest.fn(),
            'macvlan/emptyForm':          emptyForm,
            'management/all':             () => [],
            currentProduct:               { name: 'explorer' }
          }
        }
      }
    });

    const selectWraps = wrapper.findAll('.labeled-select');
    const inputWraps = wrapper.findAll('.labeled-input');

    expect(selectWraps).toHaveLength(2);
    expect(inputWraps).toHaveLength(7);
  });
});
