import { mount } from '@vue/test-utils';
import { _VIEW, _EDIT, _CREATE } from '@shell/config/query-params';
import Ssh from '@shell/edit/secret/ssh.vue';

const mockedStore = () => {
  return { getters: { 'i18n/t': jest.fn() } };
};

const mockedRoute = { query: {} };

const requiredSetup = () => {
  return {
    global: {
      mocks: {
        $store:      mockedStore(),
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
