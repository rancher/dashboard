import { shallowMount } from '@vue/test-utils';
import Tls from '@shell/edit/monitoring.coreos.com.receiver/tls.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Banner } from '@components/Banner';

describe('shell/edit/monitoring.coreos.com.receiver/tls.vue', () => {
  const mockValue = {
    tls_config: {
      ca_file: 'ca.pem', cert_file: 'cert.pem', key_file: 'key.pem'
    }
  };
  const mockMode = 'edit';

  it('should mount correctly', () => {
    const wrapper = shallowMount(Tls, {
      props: {
        value: mockValue,
        mode:  mockMode,
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('should initialize tls_config if it does not exist', () => {
    const wrapper = shallowMount(Tls, {
      props: {
        value: {},
        mode:  mockMode,
      },
    });

    expect(wrapper.props().value.tls_config).toBeDefined();
    expect(wrapper.props().value.tls_config).toStrictEqual({});
  });

  it('should render all LabeledInput components with correct labels and modes', () => {
    const wrapper = shallowMount(Tls, {
      props: {
        value: mockValue,
        mode:  mockMode,
      },
    });

    const inputs = wrapper.findAllComponents(LabeledInput);

    expect(inputs).toHaveLength(3);

    const labels = [
      '%monitoring.receiver.tls.caFilePath.label%',
      '%monitoring.receiver.tls.certFilePath.label%',
      '%monitoring.receiver.tls.keyFilePath.label%',
    ];

    inputs.forEach((input, i) => {
      expect(input.props('label')).toBe(labels[i]);
      expect(input.props('mode')).toBe(mockMode);
    });
  });

  it('should bind LabeledInput values correctly', () => {
    const wrapper = shallowMount(Tls, {
      props: {
        value: mockValue,
        mode:  mockMode,
      },
    });

    const inputs = wrapper.findAllComponents(LabeledInput);

    expect(inputs[0].props('value')).toBe(mockValue.tls_config.ca_file);
    expect(inputs[1].props('value')).toBe(mockValue.tls_config.cert_file);
    expect(inputs[2].props('value')).toBe(mockValue.tls_config.key_file);
  });

  it('should update the value when LabeledInput emits an update', async() => {
    const wrapper = shallowMount(Tls, {
      props: {
        value: {
          tls_config: {
            ca_file: '', cert_file: '', key_file: ''
          }
        },
        mode: mockMode,
      },
    });

    const inputs = wrapper.findAllComponents(LabeledInput);
    const newCaFile = 'new-ca.pem';
    const newCertFile = 'new-cert.pem';
    const newKeyFile = 'new-key.pem';

    await inputs[0].vm.$emit('update:value', newCaFile);
    await inputs[1].vm.$emit('update:value', newCertFile);
    await inputs[2].vm.$emit('update:value', newKeyFile);

    expect(wrapper.props().value.tls_config.ca_file).toBe(newCaFile);
    expect(wrapper.props().value.tls_config.cert_file).toBe(newCertFile);
    expect(wrapper.props().value.tls_config.key_file).toBe(newKeyFile);
  });

  it('should display the informational banner', () => {
    const wrapper = shallowMount(Tls, {
      props: {
        value: mockValue,
        mode:  mockMode,
      },
    });

    const banner = wrapper.findComponent(Banner);

    expect(banner.exists()).toBe(true);
    expect(banner.props('color')).toBe('info');
  });
});
