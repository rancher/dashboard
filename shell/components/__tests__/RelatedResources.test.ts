import { shallowMount } from '@vue/test-utils';
import RelatedResources from '@shell/components/RelatedResources.vue';
import { CONFIG_MAP, POD } from '@shell/config/types';

const relationships = [
  {
    toType: POD, toId: 'default/frontend-abcde', rel: 'owner', state: 'running'
  },
  {
    toType: CONFIG_MAP, toId: 'default/kube-root-ca.crt', rel: 'uses', state: 'active'
  },
];

const createWrapper = () => {
  const $store = {
    getters: {
      clusterId:           'local',
      currentStore:        () => 'cluster',
      'cluster/byId':      () => undefined,
      'cluster/schemaFor': (type: string) => ({ id: type }),
      'type-map/labelFor': (schema: any) => schema.id,
    }
  };

  // Render the name cell slot for each row, so the test can see what the table would show
  const ResourceTable = {
    props:    ['rows'],
    template: `
      <div>
        <div v-for="row in rows" :key="row.id" :data-testid="row.id">
          <slot name="cell:name" :row="row" :value="row.nameDisplay" :col="{}" />
        </div>
      </div>
    `,
  };

  // ResourcePopover is loaded asynchronously, so give the stub its props and defaults explicitly
  const ResourcePopover = {
    name:  'ResourcePopover',
    props: {
      type:           String,
      id:             String,
      name:           String,
      detailLocation: Object,
      showStatus:     { type: Boolean, default: true },
      lazy:           { type: Boolean, default: false },
    },
    template: '<span />',
  };

  return shallowMount(RelatedResources, {
    props:  { value: { metadata: { relationships } } },
    global: {
      mocks: { $store },
      stubs: {
        ResourceTable, ResourcePopover, LinkDetail: true
      },
    },
  });
};

describe('component: RelatedResources', () => {
  it('should show the name of a pod with a lazy popover that has no status dot', () => {
    const wrapper = createWrapper();

    const popover = wrapper.find('[data-testid="default/frontend-abcde"]').findComponent({ name: 'ResourcePopover' });

    expect(popover.exists()).toBe(true);
    expect(popover.props()).toStrictEqual(expect.objectContaining({
      type:           POD,
      id:             'default/frontend-abcde',
      name:           'frontend-abcde',
      showStatus:     false,
      lazy:           true,
      detailLocation: {
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          product: 'explorer', cluster: 'local', resource: POD, namespace: 'default', id: 'frontend-abcde'
        }
      },
    }));
  });

  it('should show the name of other types as a link', () => {
    const wrapper = createWrapper();

    const cell = wrapper.find('[data-testid="default/kube-root-ca.crt"]');

    expect(cell.findComponent({ name: 'ResourcePopover' }).exists()).toBe(false);
    expect(cell.findComponent({ name: 'LinkDetail' }).props('value')).toStrictEqual('kube-root-ca.crt');
  });
});
