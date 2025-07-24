import { shallowMount } from '@vue/test-utils';
import Certificate from '../Certificate.vue';

const DEFAULT_CERT_VALUE = '__[[DEFAULT_CERT]]__';

const createWrapper = (propsData = {}) => {
  return shallowMount(Certificate, { propsData });
};

describe('networking.k8s.io.ingress/Certificate.vue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with default values', () => {
    const wrapper = createWrapper();

    expect(wrapper.vm.hosts).toStrictEqual(['']);
    expect(wrapper.vm.secretVal).toStrictEqual(DEFAULT_CERT_VALUE);
    expect(wrapper.vm.secretName).toStrictEqual(DEFAULT_CERT_VALUE);
  });

  it('initializes with provided props', () => {
    const value = { hosts: ['host1', 'host2'], secretName: 'some-secret' };
    const certs = ['cert1', 'cert2'];
    const rules = { host: ['rule1'] };
    const wrapper = createWrapper({
      value, certs, rules
    });

    expect(wrapper.vm.hosts).toStrictEqual(['host1', 'host2']);
    expect(wrapper.vm.secretVal).toStrictEqual('some-secret');
    expect(wrapper.vm.secretName).toStrictEqual('some-secret');
    expect(wrapper.vm.certs).toStrictEqual(certs);
    expect(wrapper.vm.rules).toStrictEqual(rules);
  });

  it('emits update:value when update is called', async() => {
    const wrapper = createWrapper();

    wrapper.vm.hosts = ['host1'];
    wrapper.vm.secretVal = 'cert1';
    wrapper.vm.update();
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('update:value')).toBeTruthy();
    expect(wrapper.emitted('update:value')[0][0]).toStrictEqual({
      hosts:      ['host1'],
      secretName: 'cert1',
    });
  });

  it('sets secretName to null when secretVal is DEFAULT_CERT_VALUE', async() => {
    const wrapper = createWrapper();

    wrapper.vm.hosts = ['host1'];
    wrapper.vm.secretVal = DEFAULT_CERT_VALUE;
    wrapper.vm.update();
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('update:value')[0][0].secretName).toBeNull();
  });

  it('updates secretVal when onSecretInput is called with an object', async() => {
    const wrapper = createWrapper();
    const newCert = { label: 'cert1', value: 'cert1' };

    wrapper.vm.onSecretInput(newCert);
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.secretVal).toStrictEqual('cert1');
    expect(wrapper.emitted('update:value')).toBeTruthy();
    expect(wrapper.emitted('update:value')[0][0].secretName).toStrictEqual('cert1');
  });

  it('updates secretVal when onSecretInput is called with a string', async() => {
    const wrapper = createWrapper();

    wrapper.vm.onSecretInput('cert1');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.secretVal).toStrictEqual('cert1');
    expect(wrapper.emitted('update:value')).toBeTruthy();
    expect(wrapper.emitted('update:value')[0][0].secretName).toStrictEqual('cert1');
  });

  it('updates hosts when onHostsInput is called', async() => {
    const wrapper = createWrapper();

    wrapper.vm.onHostsInput(['host1', 'host2']);
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.hosts).toStrictEqual(['host1', 'host2']);
    expect(wrapper.emitted('update:value')).toBeTruthy();
    expect(wrapper.emitted('update:value')[0][0].hosts).toStrictEqual(['host1', 'host2']);
  });

  it('computes certsWithDefault correctly', () => {
    const certs = ['cert1', 'cert2'];
    const wrapper = createWrapper({ certs });
    const expectedCerts = [
      { label: '%ingress.certificates.defaultCertLabel%', value: DEFAULT_CERT_VALUE },
      { label: 'cert1', value: 'cert1' },
      { label: 'cert2', value: 'cert2' },
    ];

    expect(wrapper.vm.certsWithDefault).toStrictEqual(expectedCerts);
  });

  it('returns warning status for non-existent certificate', () => {
    const wrapper = createWrapper({
      certs: ['cert1', 'cert2'],
      value: { hosts: [''], secretName: 'non-existent-cert' },
    });

    expect(wrapper.vm.certificateStatus).toStrictEqual('warning');
  });

  it('returns null status for existing certificate', () => {
    const wrapper = createWrapper({
      certs: ['cert1', 'cert2'],
      value: { hosts: [''], secretName: 'cert1' },
    });

    expect(wrapper.vm.certificateStatus).toBeNull();
  });

  it('returns null status for default certificate', () => {
    const wrapper = createWrapper({
      certs: ['cert1', 'cert2'],
      value: { hosts: [''], secretName: null },
    });

    expect(wrapper.vm.certificateStatus).toBeNull();
  });

  it('returns correct tooltip for non-existent certificate', () => {
    const wrapper = createWrapper({
      certs: ['cert1', 'cert2'],
      value: { hosts: [''], secretName: 'non-existent-cert' },
    });

    expect(wrapper.vm.certificateTooltip).toStrictEqual('%ingress.certificates.certificate.doesntExist%');
  });

  it('returns null tooltip for existing certificate', () => {
    const wrapper = createWrapper({
      certs: ['cert1', 'cert2'],
      value: { hosts: [''], secretName: 'cert1' },
    });

    expect(wrapper.vm.certificateTooltip).toBeNull();
  });

  it('watches value prop changes', async() => {
    const wrapper = createWrapper({ value: { hosts: ['host1'], secretName: 'cert1' } });

    await wrapper.setProps({ value: { hosts: ['host2'], secretName: 'cert2' } });
    expect(wrapper.vm.hosts).toStrictEqual(['host2']);
    expect(wrapper.vm.secretVal).toStrictEqual('cert2');
    expect(wrapper.vm.secretName).toStrictEqual('cert2');
  });

  it('handles null secretName in value prop', async() => {
    const wrapper = createWrapper({ value: { hosts: ['host1'], secretName: null } });

    expect(wrapper.vm.secretVal).toStrictEqual(DEFAULT_CERT_VALUE);
    expect(wrapper.vm.secretName).toBeNull();
  });
});
