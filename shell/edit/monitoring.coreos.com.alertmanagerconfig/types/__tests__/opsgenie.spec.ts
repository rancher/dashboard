import { shallowMount } from '@vue/test-utils';
import Opsgenie from '@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/opsgenie.vue';
import { Checkbox } from '@components/Form/Checkbox';

describe('component: Opsgenie.vue', () => {
  const defaultProps = {
    mode:      'edit',
    value:     { responders: [] },
    namespace: 'test-namespace'
  };

  it('should render correctly with initial props', () => {
    const wrapper = shallowMount(Opsgenie, {
      props:  defaultProps,
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });

    const headings = wrapper.findAll('h3');

    expect(headings[0].text()).toBe('Target');
    expect(headings[1].text()).toBe('Responders');
    expect(wrapper.findComponent({ name: 'SimpleSecretSelector' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'LabeledInput' }).exists()).toBe(true);
    expect(wrapper.findComponent(Checkbox).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'ArrayList' }).exists()).toBe(true);
  });

  it('should update proxy URL', async() => {
    const wrapper = shallowMount(Opsgenie, {
      props:  defaultProps,
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });

    const labeledInput = wrapper.findComponent({ name: 'LabeledInput' });

    await labeledInput.vm.$emit('update:value', 'http://my-proxy.com');

    expect(wrapper.props('value').httpConfig.proxyURL).toBe('http://my-proxy.com');
  });

  it('should toggle send resolved alerts checkbox', async() => {
    const wrapper = shallowMount(Opsgenie, {
      props:  defaultProps,
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });

    const checkbox = wrapper.findComponent(Checkbox);

    await checkbox.vm.$emit('update:value', false);
    expect(wrapper.props('value').sendResolved).toBe(false);
  });

  it('should handle API key secret updates', async() => {
    const wrapper = shallowMount(Opsgenie, {
      props:  defaultProps,
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });

    const secretSelector = wrapper.findComponent({ name: 'SimpleSecretSelector' });

    await secretSelector.vm.$emit('updateSecretName', 'my-secret-name');
    await secretSelector.vm.$emit('updateSecretKey', 'my-secret-key');

    expect(wrapper.props('value').apiKey.name).toBe('my-secret-name');
    expect(wrapper.props('value').apiKey.key).toBe('my-secret-key');
  });

  it('should add and update a responder', async() => {
    const wrapper = shallowMount(Opsgenie, {
      props:  defaultProps,
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });

    const arrayList = wrapper.findComponent({ name: 'ArrayList' });

    await arrayList.vm.$emit('update:value', [wrapper.vm.defaultResponder]);

    const responders = wrapper.vm.responders;

    expect(responders).toHaveLength(1);
    expect(responders[0].type).toBe('team');
    expect(responders[0].target).toBe('id');

    // Manually change responder type and check if watch updates the value prop
    responders[0].type = 'user';
    await wrapper.vm.$nextTick();
    expect(wrapper.props('value').responders[0].type).toBe('user');

    // Test updateResponder method
    wrapper.vm.updateResponder({ selected: 'username', text: 'test-user' }, responders[0]);
    await wrapper.vm.$nextTick();
    expect(responders[0].target).toBe('username');
    expect(responders[0].value).toBe('test-user');
    // Check that the watcher has updated the value prop correctly
    expect(wrapper.props('value').responders[0]).toEqual({ type: 'user', username: 'test-user' });
  });

  it('should remove a responder', async() => {
    const wrapper = shallowMount(Opsgenie, {
      props: {
        ...defaultProps,
        value: {
          responders: [
            {
              type: 'team',
              id:   'team-id'
            }
          ]
        }
      },
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });

    const arrayList = wrapper.findComponent({ name: 'ArrayList' });

    // Simulate the internal workings of ArrayList for removing an item
    wrapper.vm.responders.splice(0, 1);
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.responders).toHaveLength(0);
    expect(wrapper.props('value').responders).toHaveLength(0);
  });

  it('should render in view mode', () => {
    const wrapper = shallowMount(Opsgenie, {
      props: {
        mode:  'view',
        value: {
          httpConfig:   { proxyURL: 'http://view-proxy.com' },
          sendResolved: false,
          responders:   [
            {
              type: 'user',
              name: 'view-user'
            }
          ]
        },
        namespace: 'test-namespace'
      },
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });

    const labeledInput = wrapper.findComponent({ name: 'LabeledInput' });
    const checkbox = wrapper.findComponent(Checkbox);
    const arrayList = wrapper.findComponent({ name: 'ArrayList' });

    expect(labeledInput.props('mode')).toBe('view');
    expect(checkbox.props('mode')).toBe('view');
    expect(arrayList.props('mode')).toBe('view');

    const responder = wrapper.vm.responders[0];

    expect(responder.type).toBe('user');
    expect(responder.target).toBe('name');
    expect(responder.value).toBe('view-user');
    expect(wrapper.vm.typeLabel(responder.type)).toBe('User');
    expect(wrapper.vm.targetLabel(responder.target)).toBe('Name');
  });
});
