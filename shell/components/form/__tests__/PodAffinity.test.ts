import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import PodAffinity from '@shell/components/form/PodAffinity.vue';
import { _CREATE } from '@shell/config/query-params';

const requiredSetup = () => {
  return {
    global: {
      mocks: {
        $store: {
          getters: {
            currentStore:        () => 'cluster',
            'i18n/t':            (text: string) => text,
            'cluster/schemaFor': jest.fn(),
            'cluster/canList':   jest.fn(),
          }
        }
      }
    }
  };
};

describe('component: PodAffinity', () => {
  it('should display the weight input when the priority is preferred', () => {
    const podAffinity = {
      preferredDuringSchedulingIgnoredDuringExecution: [{
        podAffinityTerm: { topologyKey: 'test topology key 1' },
        weight:          1
      }],
      requiredDuringSchedulingIgnoredDuringExecution: [{ topologyKey: 'test topology key 2' }]
    };
    const wrapper = mount(PodAffinity, {
      props: {
        mode: _CREATE, field: 'overrideAffinity', value: { overrideAffinity: { podAffinity } }
      },
      ...requiredSetup()
    });

    expect(wrapper.find('[data-testid="pod-affinity-weight-index0"]').exists()).toBeTruthy();
    expect(wrapper.find('[data-testid="pod-affinity-weight-index1"]').exists()).toBeFalsy();
  });

  it('should display the weight input when the value is cleared', async() => {
    const podAffinity = {
      preferredDuringSchedulingIgnoredDuringExecution: [{
        podAffinityTerm: { topologyKey: 'test topology key 1' },
        weight:          1
      }],
    };

    const wrapper = mount(PodAffinity, {
      props: {
        mode: _CREATE, field: 'overrideAffinity', value: { overrideAffinity: { podAffinity } }
      },
      ...requiredSetup()
    });

    const weightInput = wrapper.find('[data-testid="pod-affinity-weight-index0"]');

    weightInput.setValue('');

    await nextTick();

    expect(wrapper.find('[data-testid="pod-affinity-weight-index0"]').exists()).toBeTruthy();
  });
});
