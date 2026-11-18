import { shallowMount } from '@vue/test-utils';
import RelatedResources from '@shell/components/RelatedResources.vue';
import {
  CONFIG_MAP, MANAGEMENT, NODE, POD, WORKLOAD_TYPES
} from '@shell/config/types';

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

  describe('rows', () => {
    const mountWith = ({
      value = { metadata: { relationships } } as any, props = {}, currentStore = 'cluster', clusterId = 'local', byId = (() => undefined) as (type: string, id: string) => any, dispatch = jest.fn()
    } = {}) => shallowMount(RelatedResources, {
      props:  { value, ...props },
      global: {
        mocks: {
          $store: {
            dispatch,
            getters: {
              clusterId,
              currentStore:                    () => currentStore,
              [`${ currentStore }/byId`]:      byId,
              [`${ currentStore }/schemaFor`]: (type: string) => ({ id: type }),
              'type-map/labelFor':             (schema: any) => schema.id,
            }
          }
        },
        stubs: { ResourceTable: true },
      },
    });
    const idsOf = (wrapper: any) => wrapper.vm.rows.map((row: any) => row.id);
    const firstRow = (wrapper: any) => wrapper.vm.rows[0];

    it('should have no rows when the resource has no relationships', () => {
      const wrapper = mountWith({ value: { metadata: {} } });

      expect(wrapper.vm.rows).toStrictEqual([]);
    });

    it('should leave out the relationships of a type it is told to ignore', () => {
      const wrapper = mountWith({ props: { ignoreTypes: [CONFIG_MAP] } });

      expect(idsOf(wrapper)).toStrictEqual(['default/frontend-abcde', 'default/frontend-567d5b464c']);
    });

    it('should only show relationships of the given kind', () => {
      const wrapper = mountWith({ props: { rel: 'uses' } });

      expect(idsOf(wrapper)).toStrictEqual(['default/kube-root-ca.crt']);
    });

    it('should show the resources on the other side of the given direction', () => {
      const wrapper = mountWith({
        props: { direction: 'from' },
        value: {
          metadata: {
            relationships: [
              {
                fromType: WORKLOAD_TYPES.DEPLOYMENT, fromId: 'default/frontend', rel: 'owner', state: 'active'
              },
              {
                toType: POD, toId: 'default/frontend-abcde', rel: 'owner', state: 'running'
              },
            ]
          }
        }
      });

      expect(idsOf(wrapper)).toStrictEqual(['default/frontend']);
    });

    it('should leave out a relationship that matches resources by selector rather than naming one', () => {
      const wrapper = mountWith({
        value: {
          metadata: {
            relationships: [{
              toType: POD, toNamespace: 'default', selector: 'app=frontend', rel: 'selects'
            }]
          }
        }
      });

      expect(wrapper.vm.rows).toStrictEqual([]);
    });

    it('should link a namespaced resource to its detail page', () => {
      const wrapper = mountWith();

      expect(firstRow(wrapper).detailLocation).toStrictEqual({
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          product: 'explorer', cluster: 'local', resource: POD, namespace: 'default', id: 'frontend-abcde'
        }
      });
    });

    it('should link a resource that is not namespaced without a namespace in the route', () => {
      const wrapper = mountWith({
        value: {
          metadata: {
            relationships: [{
              toType: NODE, toId: 'node-1', rel: 'uses', state: 'active'
            }]
          }
        }
      });

      expect(firstRow(wrapper).detailLocation).toStrictEqual({
        name:   'c-cluster-product-resource-id',
        params: {
          product: 'explorer', cluster: 'local', resource: NODE, id: 'node-1'
        }
      });
    });

    it('should link a resource in the management store to the local cluster', () => {
      const wrapper = mountWith({
        currentStore: 'management',
        clusterId:    'c-m-abcde',
        value:        {
          metadata: {
            relationships: [{
              toType: MANAGEMENT.PROJECT, toId: 'local/p-abcde', rel: 'owner', state: 'active'
            }]
          }
        }
      });

      expect(firstRow(wrapper).detailLocation.params.cluster).toStrictEqual('local');
    });

    describe('getRealResources', () => {
      it('should fetch each row and return the resources that were found', async() => {
        const pod = { id: 'default/frontend-abcde' };
        const dispatch = jest.fn((action: string, { id }: any) => (id === pod.id ? Promise.resolve(pod) : Promise.reject(new Error('not found'))));
        const wrapper = mountWith({ dispatch });
        const rows = wrapper.vm.rows;

        const found = await wrapper.vm.getRealResources(rows);

        expect(dispatch).toHaveBeenCalledWith('cluster/find', { type: POD, id: 'default/frontend-abcde' });
        expect(dispatch).toHaveBeenCalledWith('cluster/find', { type: CONFIG_MAP, id: 'default/kube-root-ca.crt' });
        expect(found).toStrictEqual([pod]);
      });

      it("should show a fetched resource's own state once it is loaded", async() => {
        const store: { pod?: any } = {};
        const wrapper = mountWith({
          byId:     (type, id) => (type === POD && id === 'default/frontend-abcde' ? store.pod : undefined),
          dispatch: jest.fn(() => Promise.resolve({})),
        });

        expect(firstRow(wrapper).state).toStrictEqual('running');

        store.pod = {
          state: 'crashLoopBackOff', stateDisplay: 'CrashLoopBackOff', stateColor: 'text-error', stateBackground: 'bg-error'
        };
        await wrapper.vm.getRealResources(wrapper.vm.rows);

        expect(firstRow(wrapper).state).toStrictEqual('crashLoopBackOff');
      });
    });
  });
});
