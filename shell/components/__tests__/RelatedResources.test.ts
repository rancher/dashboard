import { shallowMount } from '@vue/test-utils';
import RelatedResources from '@shell/components/RelatedResources.vue';
import { CONFIG_MAP, POD, WORKLOAD_TYPES } from '@shell/config/types';

const relationships = [
  {
    toType: POD, toId: 'default/frontend-abcde', rel: 'owner', state: 'running'
  },
  {
    toType: CONFIG_MAP, toId: 'default/kube-root-ca.crt', rel: 'uses', state: 'active'
  },
  {
    toType: WORKLOAD_TYPES.REPLICA_SET, toId: 'default/frontend-567d5b464c', rel: 'owner', state: 'active'
  },
];

const createWrapper = (byId: (type: string, id: string) => any = () => undefined) => {
  const $store = {
    getters: {
      clusterId:           'local',
      currentStore:        () => 'cluster',
      'cluster/byId':      byId,
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
          <slot name="cell:name" :row="row" :value="row.nameDisplay" :col="{}">
            <span class="name-column-formatter">{{ row.nameDisplay }}</span>
          </slot>
        </div>
      </div>
    `,
  };

  return shallowMount(RelatedResources, {
    props:  { value: { metadata: { relationships } } },
    global: {
      mocks: { $store },
      stubs: { ResourceTable, ResourcePopover: { name: 'ResourcePopover', template: '<span />' } },
    },
  });
};

describe('component: RelatedResources', () => {
  it.each([
    ['pod', 'default/frontend-abcde', 'frontend-abcde'],
    ['ReplicaSet', 'default/frontend-567d5b464c', 'frontend-567d5b464c'],
    ['ConfigMap', 'default/kube-root-ca.crt', 'kube-root-ca.crt'],
  ])('should show the name of a %s as a link, without a popover', (_, id, name) => {
    const wrapper = createWrapper();

    const cell = wrapper.find(`[data-testid="${ id }"]`);

    expect(cell.findComponent({ name: 'ResourcePopover' }).exists()).toBe(false);
    expect(cell.find('.name-column-formatter').text()).toStrictEqual(name);
  });

  describe('state', () => {
    const rowOf = (wrapper: any, id: string) => wrapper.vm.rows.find((row: any) => row.id === id);
    const stateOf = (row: any) => ({
      state: row.state, stateDisplay: row.stateDisplay, stateBackground: row.stateBackground
    });

    it("should show the resource's own state when it is loaded, like its popover and list", () => {
      const pod = {
        state: 'crashLoopBackOff', stateDisplay: 'CrashLoopBackOff', stateColor: 'text-info', stateBackground: 'bg-info'
      };
      const wrapper = createWrapper((type, id) => (type === POD && id === 'default/frontend-abcde' ? pod : undefined));

      expect(stateOf(rowOf(wrapper, 'default/frontend-abcde'))).toStrictEqual({
        state: 'crashLoopBackOff', stateDisplay: 'CrashLoopBackOff', stateBackground: 'bg-info'
      });
    });

    it('should show the state of the relationship when the resource is not loaded', () => {
      const wrapper = createWrapper();

      expect(stateOf(rowOf(wrapper, 'default/frontend-abcde'))).toStrictEqual({
        state: 'running', stateDisplay: 'Running', stateBackground: 'bg-success'
      });
    });

    it('should show the resource as missing when neither it nor the relationship has a state', () => {
      const wrapper = shallowMount(RelatedResources, {
        props: {
          value: {
            metadata: {
              relationships: [{
                toType: POD, toId: 'default/gone', rel: 'owner'
              }]
            }
          }
        },
        global: {
          mocks: {
            $store: {
              getters: {
                clusterId:           'local',
                currentStore:        () => 'cluster',
                'cluster/byId':      () => undefined,
                'cluster/schemaFor': (type: string) => ({ id: type }),
                'type-map/labelFor': (schema: any) => schema.id,
              }
            }
          },
          stubs: { ResourceTable: true },
        },
      });

      expect(rowOf(wrapper, 'default/gone').state).toStrictEqual('missing');
    });
  });
});
