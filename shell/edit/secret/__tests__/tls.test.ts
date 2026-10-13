import { defineComponent, h } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { useFormValidation } from '@shell/composables/useFormValidation';
import Tls from '@shell/edit/secret/tls.vue';

const certificate = '-----BEGIN CERTIFICATE-----\nMIIBszCCAVmgAwIBAgIU\n-----END CERTIFICATE-----';
const privateKey = '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEF\n-----END PRIVATE KEY-----';

// Renders the TLS fields inside a parent form, like shell/edit/secret/index.vue does
const mountInForm = (decodedData: Record<string, string>, mode = _CREATE) => {
  const store = createStore({ getters: { 'i18n/t': () => (key: string) => key } });
  const value = { decodedData, setData: jest.fn() };
  const FormHost = defineComponent({
    setup() {
      const { isFormValid, veeErrors } = useFormValidation((key: string) => key, []);

      return { isFormValid, veeErrors };
    },
    render: () => h(Tls, { value, mode }),
  });

  return mount(FormHost, { global: { plugins: [store], mocks: { $store: store } } });
};

describe('component: Tls.vue', () => {
  it('should keep the form valid with a PEM certificate and private key', async() => {
    const wrapper = mountInForm({ 'tls.crt': certificate, 'tls.key': privateKey });

    await flushPromises();

    expect(wrapper.vm.isFormValid).toBe(true);
  });

  it.each([
    ['tls.crt', { 'tls.crt': 'not-a-cert', 'tls.key': privateKey }, 'validation.pemCertificate'],
    ['tls.key', { 'tls.crt': certificate, 'tls.key': 'not-a-key' }, 'validation.pemPrivateKey'],
  ])('should invalidate the form when %p is not PEM encoded', async(field, decodedData, message) => {
    const wrapper = mountInForm(decodedData);

    await flushPromises();

    expect(wrapper.vm.isFormValid).toBe(false);
    expect(wrapper.vm.veeErrors).toStrictEqual({ [field]: expect.stringContaining(message) });
  });

  it('should keep the form valid when editing with the private key left blank', async() => {
    // The key field starts blank when editing, and a blank key keeps the existing one
    const wrapper = mountInForm({ 'tls.crt': certificate, 'tls.key': privateKey }, _EDIT);

    await flushPromises();

    expect(wrapper.vm.isFormValid).toBe(true);
  });

  it('should invalidate the form when editing with a new private key that is not PEM encoded', async() => {
    const wrapper = mountInForm({ 'tls.crt': certificate, 'tls.key': privateKey }, _EDIT);

    await flushPromises();
    await wrapper.find('textarea[name="tls.key"]').setValue('not-a-key');
    await flushPromises();

    expect(wrapper.vm.veeErrors).toStrictEqual({ 'tls.key': expect.stringContaining('validation.pemPrivateKey') });
  });
});
