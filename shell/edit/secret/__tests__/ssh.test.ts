import { defineComponent, h } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { _VIEW, _EDIT, _CREATE } from '@shell/config/query-params';
import { useFormValidation } from '@shell/composables/useFormValidation';
import Ssh from '@shell/edit/secret/ssh.vue';

const mockedRoute = { query: {} };

const requiredSetup = () => {
  const store = createStore({ getters: { 'i18n/t': () => jest.fn() } });

  return {
    global: {
      plugins: [store],
      mocks:   {
        $route:      mockedRoute,
        $fetchState: {},
      }
    }
  };
};

const decodedData = {
  known_hosts:      'S05PV05fSE9TVFM=',
  'ssh-privatekey': 'dGVzdDE=',
  'ssh-publickey':  'dGVzdDE='
};

describe.each([
  _CREATE,
  _EDIT,
  _VIEW
])('component: Ssh.vue', (mode) => {
  it(`mode: ${ mode }, should show input fields`, () => {
    const wrapper = mount(Ssh, {
      ...requiredSetup(),
      props: {
        value: {
          name:                  'foo',
          decodedData,
          supportsSshKnownHosts: true
        },
        mode,
      },
    });

    const publicKey = wrapper.find('[data-testid="ssh-public-key"]').element as HTMLInputElement;
    const privateKey = wrapper.find('[data-testid="ssh-private-key"]').element as HTMLInputElement;
    const knownHosts = wrapper.find('[data-testid="ssh-known-hosts"]').element as HTMLInputElement;

    expect(publicKey.value).toBe('dGVzdDE=');
    expect(privateKey.value).toBe('dGVzdDE=');
    expect(knownHosts.value).toBe('S05PV05fSE9TVFM=');
  });

  it.each([
    ['show', true],
    ['hide', false],
  ])(`mode: ${ mode }, should %p known_hosts`, (
    _,
    supportsSshKnownHosts,
  ) => {
    const wrapper = mount(Ssh, {
      ...requiredSetup(),
      props: {
        value: {
          name: 'foo',
          decodedData,
          supportsSshKnownHosts
        },
        mode: _EDIT,
      },
    });

    const knownHosts = wrapper.find('[data-testid="ssh-known-hosts"]');

    expect(knownHosts.exists()).toBe(supportsSshKnownHosts);
  });
});

describe('component: Ssh.vue validation', () => {
  const publicKey = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMq user@host';
  const privateKey = '-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAA\n-----END OPENSSH PRIVATE KEY-----';

  // Renders the SSH fields inside a parent form, like shell/edit/secret/index.vue does
  const mountInForm = (decodedData: Record<string, string>) => {
    const store = createStore({ getters: { 'i18n/t': () => (key: string) => key } });
    const value = {
      decodedData, supportsSshKnownHosts: false, setData: jest.fn()
    };
    const FormHost = defineComponent({
      setup() {
        const { isFormValid, veeErrors } = useFormValidation((key: string) => key, []);

        return { isFormValid, veeErrors };
      },
      render: () => h(Ssh, { value, mode: _CREATE }),
    });

    return mount(FormHost, { global: { plugins: [store], mocks: { $store: store } } });
  };

  it('should keep the form valid with an SSH public key and a private key', async() => {
    const wrapper = mountInForm({ 'ssh-publickey': publicKey, 'ssh-privatekey': privateKey });

    await flushPromises();

    expect(wrapper.vm.isFormValid).toBe(true);
  });

  it.each([
    ['ssh-publickey', { 'ssh-publickey': 'opa', 'ssh-privatekey': privateKey }, 'validation.sshPublicKey'],
    ['ssh-privatekey', { 'ssh-publickey': publicKey, 'ssh-privatekey': 'op' }, 'validation.pemPrivateKey'],
  ])('should invalidate the form when %p is not a valid key', async(field, decodedData, message) => {
    const wrapper = mountInForm(decodedData);

    await flushPromises();

    expect(wrapper.vm.isFormValid).toBe(false);
    expect(wrapper.vm.veeErrors).toStrictEqual({ [field]: expect.stringContaining(message) });
  });
});
