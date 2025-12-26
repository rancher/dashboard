import { mount } from '@vue/test-utils';
import SeccompProfile from '@shell/components/form/SeccompProfile.vue';

describe('component: SeccompProfile', () => {
  // A mock for the i18n t function
  const mockT = (key) => key;

  const defaultMountOptions = {
    props: {
      mode:                'mode',
      title:               'Test Title',
      seccompProfileTypes: [
        { label: 'None', value: 'None' },
        { label: 'RuntimeDefault', value: 'RuntimeDefault' },
        { label: 'Localhost', value: 'Localhost' },
        { label: 'Unconfined', value: 'Unconfined' },
      ]
    },
    global: { mocks: { $store: { getters: { 'i18n/t': mockT } } } }
  };

  it('should initialize with type "None" when no seccompProfile is provided', () => {
    const wrapper = mount(SeccompProfile, {
      ...defaultMountOptions,
      props: {
        ...defaultMountOptions.props,
        value: {} // Empty securityContext
      }
    });

    expect(wrapper.vm.type).toBe('None');
  });

  it('should initialize with the correct type when seccompProfile is provided', () => {
    const wrapper = mount(SeccompProfile, {
      ...defaultMountOptions,
      props: {
        ...defaultMountOptions.props,
        value: { type: 'Unconfined' }
      }
    });

    expect(wrapper.vm.type).toBe('Unconfined');
  });

  it('should initialize with localhostProfile when type is Localhost', () => {
    const wrapper = mount(SeccompProfile, {
      ...defaultMountOptions,
      props: {
        ...defaultMountOptions.props,
        value: { type: 'Localhost', localhostProfile: '/my/path' }
      }
    });

    expect(wrapper.vm.type).toBe('Localhost');
    expect(wrapper.vm.localhostProfile).toBe('/my/path');
    // The localhost input should be visible
    expect(wrapper.find('[data-testid="seccomp-localhost-input"]').exists()).toBe(true);
  });

  it('should emit an update event to remove seccompProfile when type is changed to "None"', async() => {
    const wrapper = mount(SeccompProfile, {
      ...defaultMountOptions,
      props: {
        ...defaultMountOptions.props,
        value: { seccompProfile: { type: 'Unconfined' } }
      }
    });

    // Simulate changing select to 'None'
    wrapper.vm.type = 'None';
    await wrapper.vm.update();

    const emitted = wrapper.emitted('update:value');

    expect(emitted).toHaveLength(1);
    // It should remove seccompProfile
    expect(emitted[0][0]).toBeUndefined();
  });

  it('should emit an update event when the type is changed', async() => {
    const wrapper = mount(SeccompProfile, {
      ...defaultMountOptions,
      props: {
        ...defaultMountOptions.props,
        value: { seccompProfile: { type: 'RuntimeDefault' } }
      }
    });

    // Simulate changing the select
    wrapper.vm.type = 'Unconfined';
    await wrapper.vm.update();

    const emitted = wrapper.emitted('update:value');

    expect(emitted).toHaveLength(1);
    expect(emitted[0][0]).toStrictEqual({ type: 'Unconfined' });
  });

  it('should emit an update event with localhostProfile when type is Localhost', async() => {
    const wrapper = mount(SeccompProfile, {
      ...defaultMountOptions,
      props: {
        ...defaultMountOptions.props,
        value: { seccompProfile: { type: 'RuntimeDefault' } }
      }
    });

    // Simulate changing to Localhost and filling the input
    wrapper.vm.type = 'Localhost';
    wrapper.vm.localhostProfile = '/my/local/path';
    await wrapper.vm.update();

    const emitted = wrapper.emitted('update:value');

    expect(emitted).toHaveLength(1);
    expect(emitted[0][0]).toStrictEqual(
      {
        type:             'Localhost',
        localhostProfile: '/my/local/path'
      }
    );
  });
});
