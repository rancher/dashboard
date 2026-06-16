import { mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import FleetValuesFrom from '@shell/components/fleet/FleetValuesFrom.vue';

const requiredSetup = () => {
  return { global: { mocks: { $store: { getters: { namespaces: () => ['fleet-default', 'fleet-local'] } } } } };
};

const allConfigMaps = [
  {
    id:       'fleet-local/configmap-1',
    name:     'configmap-1',
    metadata: {
      namespace: 'fleet-local',
      name:      'configmap-1'
    },
    data: { foo0: 'bar0' }
  },
  {
    id:       'fleet-default/configmap-2',
    name:     'configmap-2',
    metadata: {
      namespace: 'fleet-default',
      name:      'configmap-2'
    },
    data: { foo1: 'bar1' }
  }
];

const allSecrets = [
  {
    id:       'fleet-local/secret-1',
    name:     'secret-1',
    metadata: {
      namespace: 'fleet-local',
      name:      'secret-1'
    },
    data: { foo2: 'bar2' }
  },
  {
    id:       'fleet-default/secret-2',
    name:     'secret-2',
    metadata: {
      namespace: 'fleet-default',
      name:      'secret-2'
    },
    data: { foo3: 'bar3' }
  }
];

describe('component: FleetValuesFrom', () => {
  describe.each([
    _CREATE,
    _EDIT
  ])('mode: %p', (mode) => {
    it('should show loading label when secrets or configMaps are empty', async() => {
      const wrapper = mount(FleetValuesFrom, {
        ...requiredSetup(),
        props: {
          value:     [],
          namespace: 'fleet-default',
          mode,
        },
      });

      await flushPromises();

      const loading = wrapper.find('[data-testid="fleet-values-from-loading"]');
      const itemsContainer = wrapper.find('[data-testid="fleet-values-from-list"]');

      expect(itemsContainer.exists()).toBe(false);
      expect(loading.exists()).toBe(true);
    });

    it('should decode spec.helm.valuesFrom to build UI form', async() => {
      const wrapper = mount(FleetValuesFrom, {
        ...requiredSetup(),
        props: {
          value: [
            {
              configMapKeyRef: {
                key:       'foo0',
                name:      'configmap-2',
                namespace: 'fleet-default'
              }
            },
            {
              secretKeyRef: {
                key:       'foo3',
                name:      'secret-2',
                namespace: 'fleet-default'
              }
            }
          ],
          namespace: 'fleet-default',
          mode,
        },
        data: () => ({
          allSecrets,
          allConfigMaps
        })
      });

      await flushPromises();

      const configMapRef = wrapper.find('[data-testid="fleet-values-from-item-0"]').element;
      const secretRef = wrapper.find('[data-testid="fleet-values-from-item-1"]').element;

      expect(configMapRef.textContent).toContain('configMapKeyRef'); // Type column
      expect(configMapRef.textContent).toContain('configmap-2'); // ConfigMap column
      expect(configMapRef.textContent).toContain('foo0'); // Key column

      expect(secretRef.textContent).toContain('secretKeyRef'); // Type column
      expect(secretRef.textContent).toContain('secret-2'); // Secret column
      expect(secretRef.textContent).toContain('foo3'); // Key column
    });

    it.each([
      'fleet-default',
      'fleet-local'
    ])('should encode UI rows to spec.helm.valuesFrom having namespace %p', async(namespace) => {
      const wrapper = mount(FleetValuesFrom, {
        ...requiredSetup(),
        props: {
          value: [],
          namespace,
          mode,
        },
      });

      wrapper.setData({
        valuesFrom: [
          {
            id:        0,
            valueFrom: {
              configMapKeyRef: {
                key:  'foo0',
                name: 'configmap-2'
              }
            }
          },
          {
            id:        1,
            valueFrom: {
              secretKeyRef: {
                key:  'foo2',
                name: 'secret-2'
              }
            }
          }
        ]
      });

      wrapper.vm.update();

      await flushPromises();

      expect(wrapper.emitted('update:value')?.[0][0]).toStrictEqual([{
        configMapKeyRef: {
          key: 'foo0', name: 'configmap-2', namespace,
        }
      }, {
        secretKeyRef: {
          key: 'foo2', name: 'secret-2', namespace,
        }
      }]);
    });

    it('should reset ConfigMap/Secret and Key columns on Type change', async() => {
      const wrapper = mount(FleetValuesFrom, {
        ...requiredSetup(),
        props: {
          value: [
            {
              configMapKeyRef: {
                key:       'foo0',
                name:      'configmap-2',
                namespace: 'fleet-default'
              }
            },
            {
              secretKeyRef: {
                key:       'foo3',
                name:      'secret-2',
                namespace: 'fleet-default'
              }
            }
          ],
          namespace: 'fleet-default',
          mode,
        },
        data: () => ({
          allSecrets,
          allConfigMaps
        })
      });

      await flushPromises();

      // Change Type from ConfigMap Key to Secret Key
      wrapper.vm.updateValueFrom(0, {
        name:      'configmap-2',
        valueFrom: {
          secretKeyRef: {
            key:      'foo0',
            name:     'configmap-2',
            optional: false
          }
        }
      } as any);

      await flushPromises();

      const exConfigMapRef = wrapper.find('[data-testid="fleet-values-from-item-0"]').element;

      // Type column is changed to Secret
      expect(exConfigMapRef.textContent).toContain('secretKeyRef'); // Type column

      // Config Map and Key fields are deleted from row 1
      expect(exConfigMapRef.textContent).not.toContain('configmap-2'); // ConfigMap column
      expect(exConfigMapRef.textContent).not.toContain('foo0'); // Key column

      // excluding row 1 from emit
      expect(wrapper.emitted('update:value')?.[0][0]).toStrictEqual([{
        secretKeyRef: {
          key: 'foo3', name: 'secret-2', namespace: 'fleet-default'
        }
      }]);
    });

    it('should reset Key column on Ref change', async() => {
      const wrapper = mount(FleetValuesFrom, {
        ...requiredSetup(),
        props: {
          value: [
            {
              configMapKeyRef: {
                key:       'foo0',
                name:      'configmap-2',
                namespace: 'fleet-default'
              }
            },
            {
              secretKeyRef: {
                key:       'foo3',
                name:      'secret-2',
                namespace: 'fleet-default'
              }
            }
          ],
          namespace: 'fleet-default',
          mode,
        },
        data: () => ({
          allSecrets,
          allConfigMaps
        })
      });

      await flushPromises();

      // Change Config Map ref
      wrapper.vm.updateValueFrom(0, {
        name:      'configmap-3',
        valueFrom: {
          configMapKeyRef: {
            key:      'foo4',
            name:     'configmap-3',
            optional: false
          }
        }
      } as any);

      await flushPromises();

      const configMapRef = wrapper.find('[data-testid="fleet-values-from-item-0"]').element;

      // Type column is not changed
      expect(configMapRef.textContent).toContain('configMapKeyRef'); // Type column

      // Config Map column is now configmap-3
      expect(configMapRef.textContent).toContain('configmap-3'); // ConfigMap column

      // Key column is empty
      expect(configMapRef.textContent).toContain('workload.container.command.fromResource.key.label%Loading'); // Key column

      // Emit empty Key
      expect(wrapper.emitted('update:value')?.[0][0]).toStrictEqual([{
        configMapKeyRef: {
          key: '', name: 'configmap-3', namespace: 'fleet-default'
        }
      }, {
        secretKeyRef: {
          key: 'foo3', name: 'secret-2', namespace: 'fleet-default'
        }
      }]);
    });
  });
});
