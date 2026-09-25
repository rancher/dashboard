import { shallowMount } from '@vue/test-utils';
import RcACE from '@shell/edit/provisioning.cattle.io.cluster/tabs/networking/RcACE.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import FileSelectorTextArea from '@shell/components/form/FileSelectorTextArea.vue';
import { _EDIT } from '@shell/config/query-params';

// The default shallow-mount stub doesn't render its default slot, which would hide the content under test
const RcContentGroupStub = {
  name:     'RcContentGroup',
  template: '<div><slot /></div>',
};

describe('component: RcACE', () => {
  const mountComponent = (value = {}) => {
    return shallowMount(RcACE, {
      props: {
        mode:  _EDIT,
        value: {
          enabled: false, fqdn: '', caCerts: '', ...value
        },
      },
      global: { stubs: { RcContentGroup: RcContentGroupStub } },
    });
  };

  it('should wrap its content in an RcContentGroup', () => {
    const wrapper = mountComponent();

    expect(wrapper.findComponent(RcContentGroupStub).exists()).toBe(true);
  });

  it('should render the enabled radio group', () => {
    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="ace-enabled-radio-input"]').exists()).toBe(true);
  });

  it.each([
    ['ace-fqdn-input'],
    ['ace-cacerts-input'],
  ])('should not render %s when the endpoint is disabled', (testId) => {
    const wrapper = mountComponent({ enabled: false });

    expect(wrapper.find(`[data-testid="${ testId }"]`).exists()).toBe(false);
  });

  it.each([
    ['ace-fqdn-input'],
    ['ace-cacerts-input'],
  ])('should render %s when the endpoint is enabled', (testId) => {
    const wrapper = mountComponent({ enabled: true });

    expect(wrapper.find(`[data-testid="${ testId }"]`).exists()).toBe(true);
  });

  it('should emit local-cluster-auth-endpoint-changed when the radio group changes', () => {
    const wrapper = mountComponent();

    wrapper.findComponent({ name: 'RadioGroup' }).vm.$emit('update:value', true);

    expect(wrapper.emitted('local-cluster-auth-endpoint-changed')).toStrictEqual([[true]]);
  });

  it('should emit fqdn-changed when the FQDN changes', () => {
    const wrapper = mountComponent({ enabled: true });

    wrapper.findComponent(LabeledInput).vm.$emit('update:value', 'example.com');

    expect(wrapper.emitted('fqdn-changed')).toStrictEqual([['example.com']]);
  });

  it('should emit ca-certs-changed when the CA certificates change', () => {
    const wrapper = mountComponent({ enabled: true });

    wrapper.findComponent(FileSelectorTextArea).vm.$emit('update:value', 'cert');

    expect(wrapper.emitted('ca-certs-changed')).toStrictEqual([['cert']]);
  });
});
