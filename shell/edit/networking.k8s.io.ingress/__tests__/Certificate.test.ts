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
});
