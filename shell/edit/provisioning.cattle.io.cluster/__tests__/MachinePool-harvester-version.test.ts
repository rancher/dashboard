import { defineComponent } from 'vue';
import { shallowMount } from '@vue/test-utils';
import MachinePool from '@shell/edit/provisioning.cattle.io.cluster/tabs/MachinePool.vue';

const MachineConfig = defineComponent({
  name:  'MachineConfig',
  props: {
    cluster: Object, previousKubeVersion: String, poolCreateMode: Boolean
  },
  template: '<div />'
});

describe('MachinePool Harvester version context', () => {
  it('passes saved and selected Kubernetes versions to the machine config', async() => {
    const cluster = { spec: { kubernetesVersion: 'v1.35.1+rke2r1' } };
    const pool = {
      id:     'pool',
      create: false,
      pool:   { name: 'pool', quantity: 3 },
      config: {}
    };
    const wrapper = shallowMount(MachinePool, {
      props: {
        value:               pool,
        cluster,
        previousKubeVersion: 'v1.35.1+rke2r1',
        mode:                'edit',
        provider:            'harvester',
        idx:                 0,
        machinePools:        [pool],
        poolId:              'pool',
        poolCreateMode:      false
      },
      global: {
        mocks: {
          $store: {
            getters: {
              'i18n/t':                                   (key: string) => key,
              'i18n/exists':                              () => false,
              'type-map/hasCustomMachineConfigComponent': () => true,
              'type-map/importMachineConfig':             () => MachineConfig,
              'features/get':                             () => false
            },
            dispatch: jest.fn()
          }
        }
      }
    });

    await wrapper.setProps({ cluster: { spec: { kubernetesVersion: 'v1.35.2+rke2r1' } } });

    expect(wrapper.findComponent(MachineConfig).props()).toStrictEqual({
      cluster:             { spec: { kubernetesVersion: 'v1.35.2+rke2r1' } },
      previousKubeVersion: 'v1.35.1+rke2r1',
      poolCreateMode:      false
    });
    wrapper.unmount();
  });
});
