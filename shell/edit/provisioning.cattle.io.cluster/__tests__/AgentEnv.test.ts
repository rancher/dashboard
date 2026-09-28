import { mount } from '@vue/test-utils';
import AgentEnv from '@shell/edit/provisioning.cattle.io.cluster/AgentEnv.vue';

describe('component: AgentEnv', () => {
  it('should only accept text files (not binary) on the KeyValue file upload', () => {
    const wrapper = mount(AgentEnv, {
      props: {
        mode:  'edit',
        value: { spec: { agentEnvVars: [] } },
      },
      global: {
        mocks: { t: (key: string) => key },
        stubs: {
          Tab:      { template: '<div><slot /></div>' },
          KeyValue: true,
        },
      },
    });

    const keyValue = wrapper.findComponent({ name: 'KeyValue' });

    expect(keyValue.exists()).toBe(true);
    expect(keyValue.props('readAccept')).toBe('text/plain');
  });
});
