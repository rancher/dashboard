
import Tls from '@shell/edit/monitoring.coreos.com.alertmanagerconfig/tls.vue';
import { shallowMount } from '@vue/test-utils';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import SimpleSecretSelector from '@shell/components/form/SimpleSecretSelector.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Banner } from '@components/Banner';

describe('component: Tls', () => {
  const mockStore = {
    getters: {
      'i18n/t':      (key: string) => key,
      'i18n/exists': () => true,
    },
  };

  const requiredProps = {
    value:     { tlsConfig: {} },
    namespace: 'test-namespace',
  };

  it('should render all child components', () => {
    const wrapper = shallowMount(Tls, {
      props:  { ...requiredProps, mode: _EDIT },
      global: { mocks: mockStore },
    });

    const secretSelectors = wrapper.findAllComponents(SimpleSecretSelector);
    const labeledInput = wrapper.findComponent(LabeledInput);

    expect(secretSelectors).toHaveLength(3);
    expect(labeledInput.exists()).toBe(true);
  });

  it('should show a banner if namespace is not provided', () => {
    const wrapper = shallowMount(Tls, {
      props: {
        ...requiredProps,
        namespace: undefined,
        mode:      _EDIT,
      },
      global: { mocks: mockStore },
    });
    const banner = wrapper.findComponent(Banner);

    expect(banner.exists()).toBe(true);
    expect(banner.props().color).toBe('error');
    expect(banner.vm.$slots.default()[0].children).toBe('%alertmanagerConfigReceiver.namespaceWarning%');
  });

  it('should not show a banner if namespace is provided', () => {
    const wrapper = shallowMount(Tls, {
      props:  { ...requiredProps, mode: _EDIT },
      global: { mocks: mockStore },
    });
    const banner = wrapper.findComponent(Banner);

    expect(banner.exists()).toBe(false);
  });

  it('should disable inputs when in view mode', () => {
    const wrapper = shallowMount(Tls, {
      props:  { ...requiredProps, mode: _VIEW },
      global: { mocks: mockStore },
    });

    const secretSelectors = wrapper.findAllComponents(SimpleSecretSelector);
    const labeledInput = wrapper.findComponent(LabeledInput);

    secretSelectors.forEach((s) => expect(s.props().disabled).toBe(true));
    expect(labeledInput.props().mode).toBe(_VIEW);
  });

  it('should initialize tlsConfig if not present', () => {
    const value = {};
    const wrapper = shallowMount(Tls, {
      props: {
        ...requiredProps,
        value,
        mode: _EDIT,
      },
      global: { mocks: mockStore },
    });

    expect(wrapper.props().value.tlsConfig).toBeDefined();
  });

  it('should correctly initialize data from props', () => {
    const value = {
      tlsConfig: {
        ca: {
          secret: {
            key:  'ca-key',
            name: 'ca-name'
          }
        },
        cert: {
          secret: {
            key:  'cert-key',
            name: 'cert-name'
          }
        },
        keySecret: {
          key:  'key-key',
          name: 'key-name'
        }
      }
    };

    const wrapper = shallowMount(Tls, {
      props: {
        ...requiredProps,
        value,
        mode: _EDIT,
      },
      global: { mocks: mockStore },
    });

    const data = wrapper.vm.$data;

    expect(data.initialCaSecretKey).toBe('ca-key');
    expect(data.initialCaSecretName).toBe('ca-name');
    expect(data.initialClientCertSecretKey).toBe('cert-key');
    expect(data.initialClientCertSecretName).toBe('cert-name');
    expect(data.initialClientKeySecretKey).toBe('key-key');
    expect(data.initialClientKeySecretName).toBe('key-name');
  });

  describe('event handling', () => {
    it.each([
      ['ca', 0, 'ca', 'updateCaSecretName', 'updateCaSecretKey'],
      ['cert', 1, 'cert', 'updateClientCertSecretName', 'updateClientCertSecretKey'],
      ['key', 2, 'keySecret', 'updateClientKeySecretName', 'updateClientKeySecretKey'],
    ])('should handle %p secret selector events', async(secretType, index, tlsConfigKey, nameHandler, keyHandler) => {
      const value = { tlsConfig: {} };
      const wrapper = shallowMount(Tls, {
        props: {
          ...requiredProps, value, mode: _EDIT
        },
        global: { mocks: mockStore },
      });

      const secretSelector = wrapper.findAllComponents(SimpleSecretSelector)[index];
      const name = `${ secretType }-secret-name`;
      const key = `${ secretType }-secret-key`;

      await secretSelector.vm.$emit('updateSecretName', name);
      await wrapper.vm.$nextTick();

      const nameValue = tlsConfigKey === 'keySecret' ? value.tlsConfig[tlsConfigKey].name : value.tlsConfig[tlsConfigKey].secret.name;

      expect(nameValue).toBe(name);

      await secretSelector.vm.$emit('updateSecretKey', key);
      await wrapper.vm.$nextTick();

      const keyValue = tlsConfigKey === 'keySecret' ? value.tlsConfig[tlsConfigKey].key : value.tlsConfig[tlsConfigKey].secret.key;

      expect(keyValue).toBe(key);
    });
  });

  describe('secret updates', () => {
    it.each([
      ['Ca', 'updateCaSecretName', 'ca', 'name'],
      ['Ca', 'updateCaSecretKey', 'ca', 'key'],
      ['ClientCert', 'updateClientCertSecretName', 'cert', 'name'],
      ['ClientCert', 'updateClientCertSecretKey', 'cert', 'key'],
      ['ClientKey', 'updateClientKeySecretName', 'keySecret', 'name'],
      ['ClientKey', 'updateClientKeySecretKey', 'keySecret', 'key'],
    ])('should update %p secret %p', (secret, handler, obj, field) => {
      const value = { tlsConfig: {} };
      const wrapper = shallowMount(Tls, {
        props: {
          ...requiredProps,
          value,
          mode: _EDIT
        },
        global: { mocks: mockStore },
      });

      const data = 'test-data';

      (wrapper.vm as any)[handler](data);

      const dataValue = obj === 'keySecret' ? value.tlsConfig[obj][field] : value.tlsConfig[obj].secret[field];

      expect(dataValue).toBe(data);
    });

    it.each([
      ['Ca', 'updateCaSecretName', 'ca'],
      ['ClientCert', 'updateClientCertSecretName', 'cert'],
    ])('should remove %p secret', (secret, handler, obj) => {
      const value = { tlsConfig: { [obj]: { secret: { name: 'test-name', key: 'test-key' } } } };
      const wrapper = shallowMount(Tls, {
        props: {
          ...requiredProps,
          value,
          mode: _EDIT
        },
        global: { mocks: mockStore },
      });

      (wrapper.vm as any)[handler]('__[[NONE]]__');

      expect(value.tlsConfig[obj]).toStrictEqual({});
    });

    it('should remove "ClientKey" secret', () => {
      const value = { tlsConfig: { keySecret: { name: 'test-name', key: 'test-key' } } };
      const wrapper = shallowMount(Tls, {
        props: {
          ...requiredProps,
          value,
          mode: _EDIT
        },
        global: { mocks: mockStore },
      });

      (wrapper.vm as any).updateClientKeySecretName('__[[NONE]]__');

      expect(value.tlsConfig.keySecret).toStrictEqual({});
    });
  });
});
