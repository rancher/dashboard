import { mount } from '@vue/test-utils';
import AgentEnv from '@shell/edit/provisioning.cattle.io.cluster/AgentEnv.vue';

describe('component: AgentEnv', () => {
  it('should display proxy tips', () => {
    const mockT = jest.fn();
    const wrapper = mount(AgentEnv, {
      propsData: {
        mode:  'edit',
        value: { spec: { agentEnvVars: [] } }
      },
      mocks: { t: mockT },
      stubs: {
        Markdown: true,
        Tab:      { template: '<div><slot></slot></div>' },
        KeyValue: true
      }

    });

    expect(wrapper.example).not.toBeNull();
    expect(mockT).toHaveBeenCalledWith('cluster.agentEnvVars.tips');
  });
});
