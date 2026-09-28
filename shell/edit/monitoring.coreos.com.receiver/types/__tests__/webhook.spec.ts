
import { shallowMount } from '@vue/test-utils';
import Webhook from '@shell/edit/monitoring.coreos.com.receiver/types/webhook.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import TLS from '@shell/edit/monitoring.coreos.com.receiver/tls.vue';
import Auth from '@shell/edit/monitoring.coreos.com.receiver/auth.vue';
import { Banner } from '@components/Banner';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import { ALIBABA_CLOUD_SMS_URL, MS_TEAMS_URL } from '@shell/edit/monitoring.coreos.com.receiver/types/webhook.add.vue';

describe('component: Webhook', () => {
  const mockStore = {
    getters: {
      'i18n/t':      (key: string) => key,
      'i18n/exists': () => true,
    },
  };

  const requiredProps = {
    mode:  _EDIT,
    value: {},
  };

  it('should render all child components', () => {
    const wrapper = shallowMount(Webhook, {
      props:  requiredProps,
      global: { mocks: mockStore },
    });

    const labeledInputs = wrapper.findAllComponents(LabeledInput);
    const checkbox = wrapper.findComponent(Checkbox);
    const tls = wrapper.findComponent(TLS);
    const auth = wrapper.findComponent(Auth);

    expect(labeledInputs).toHaveLength(2);
    expect(checkbox.exists()).toBe(true);
    expect(tls.exists()).toBe(true);
    expect(auth.exists()).toBe(true);
  });

  it('should pass down the mode prop to child components', () => {
    const wrapper = shallowMount(Webhook, {
      props:  requiredProps,
      global: { mocks: mockStore },
    });

    const labeledInputs = wrapper.findAllComponents(LabeledInput);
    const checkbox = wrapper.findComponent(Checkbox);
    const tls = wrapper.findComponent(TLS);
    const auth = wrapper.findComponent(Auth);

    labeledInputs.forEach((input) => {
      expect(input.props().mode).toBe(_EDIT);
    });

    expect(checkbox.props().mode).toBe(_EDIT);
    expect(tls.props().mode).toBe(_EDIT);
    expect(auth.props().mode).toBe(_EDIT);
  });

  describe('data initialization', () => {
    it('should initialize http_config and send_resolved', () => {
      const value = {};
      const wrapper = shallowMount(Webhook, {
        props: {
          ...requiredProps,
          value,
        },
        global: { mocks: mockStore },
      });

      expect(wrapper.props().value.http_config).toBeDefined();
      expect(wrapper.props().value.send_resolved).toBe(false);
    });

    it.each([
      [true, _CREATE, MS_TEAMS_URL],
      [true, _EDIT, MS_TEAMS_URL],
      [false, _VIEW, MS_TEAMS_URL],
      [true, _CREATE, ALIBABA_CLOUD_SMS_URL],
      [true, _EDIT, ALIBABA_CLOUD_SMS_URL],
      [false, _VIEW, ALIBABA_CLOUD_SMS_URL],
      [false, _CREATE, 'https://some.other.url/'],
    ])('should set showNamespaceBanner to %p when mode is %p and url is %p', (expected, mode, url) => {
      const value = { url };
      const wrapper = shallowMount(Webhook, {
        props: {
          ...requiredProps,
          value,
          mode,
        },
        global: { mocks: mockStore },
      });

      expect(wrapper.vm.showNamespaceBanner).toBe(expected);
    });
  });

  describe('banner', () => {
    it('should show banner when showNamespaceBanner is true', () => {
      const wrapper = shallowMount(Webhook, {
        props: {
          ...requiredProps,
          value: { url: MS_TEAMS_URL },
          mode:  _CREATE,
        },
        global: { mocks: mockStore },
      });

      const banner = wrapper.findComponent(Banner);

      expect(banner.exists()).toBe(true);
    });

    it('should not show banner when showNamespaceBanner is false', () => {
      const wrapper = shallowMount(Webhook, {
        props: {
          ...requiredProps,
          value: { url: 'https://some.other.url/' },
          mode:  _CREATE,
        },
        global: { mocks: mockStore },
      });

      const banner = wrapper.findComponent(Banner);

      expect(banner.exists()).toBe(false);
    });
  });
});
