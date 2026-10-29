import { shallowMount, VueWrapper } from '@vue/test-utils';
import { createStore } from 'vuex';
import CruSecret from '@shell/edit/secret/index.vue';
import GenericSecretData from '@shell/edit/secret/generic.vue';
import Basic from '@shell/edit/secret/basic.vue';
import Registry from '@shell/edit/secret/registry.vue';
import Ssh from '@shell/edit/secret/ssh.vue';
import Tls from '@shell/edit/secret/tls.vue';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { SECRET_TYPES as TYPES } from '@shell/config/secret';

const createWrapper = (value: any, mode = _EDIT): VueWrapper<any> => {
  const store = createStore({ getters: { 'i18n/t': () => (key: string) => key } });

  return shallowMount(CruSecret, {
    props: {
      value: {
        metadata: { name: 'my-secret', namespace: 'default' },
        data:     {},
        ...value
      },
      mode,
      realMode: mode,
    },
    global: {
      plugins: [store],
      mocks:   {
        $store: {
          getters: {
            'i18n/t':                (key: string) => key,
            'prefs/get':             () => true,
            currentCluster:          { id: 'local' },
            currentStore:            () => 'cluster',
            'type-map/optionsFor':   () => ({}),
            'i18n/withFallback':     (key: string, args: any, fallback: string) => fallback,
            'type-map/importDetail': () => undefined,
          },
          dispatch: jest.fn(),
        },
        $route:      { name: 'test-route', query: {} },
        $router:     { applyQuery: jest.fn() },
        $fetchState: { pending: false },
      },
      stubs: {
        CruResource: {
          name: 'CruResource', template: '<div><slot /></div>', props: ['canYaml']
        },
        Tabbed: { template: '<div><slot /></div>' },
        Tab:    { template: '<div><slot /></div>' },
      },
    },
  });
};

describe('component: CruSecret', () => {
  describe('helm release secrets', () => {
    it('shows a banner instead of the data editor when editing', () => {
      const wrapper = createWrapper({ _type: TYPES.HELM_RELEASE, isHelmRelease: true });

      expect(wrapper.find('[data-testid="secret-helm-release-banner"]').exists()).toBe(true);
      expect(wrapper.findComponent(GenericSecretData).exists()).toBe(false);
    });

    it('hides the edit as yaml button when editing', () => {
      const wrapper = createWrapper({ _type: TYPES.HELM_RELEASE, isHelmRelease: true });

      expect(wrapper.findComponent({ name: 'CruResource' }).props('canYaml')).toBe(false);
    });

    it('keeps the data editor and edit as yaml button when creating', () => {
      const wrapper = createWrapper({ _type: TYPES.HELM_RELEASE, isHelmRelease: true }, _CREATE);

      expect(wrapper.find('[data-testid="secret-helm-release-banner"]').exists()).toBe(false);
      expect(wrapper.findComponent(GenericSecretData).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'CruResource' }).props('canYaml')).toBe(true);
    });
  });

  it('keeps the data editor and edit as yaml button when editing other secrets', () => {
    const wrapper = createWrapper({ _type: TYPES.OPAQUE, isHelmRelease: false });

    expect(wrapper.find('[data-testid="secret-helm-release-banner"]').exists()).toBe(false);
    expect(wrapper.findComponent(GenericSecretData).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'CruResource' }).props('canYaml')).toBe(true);
  });

  it.each([
    [TYPES.OPAQUE, GenericSecretData],
    [TYPES.DOCKER_JSON, Registry],
    [TYPES.TLS, Tls],
    [TYPES.SSH, Ssh],
    [TYPES.BASIC, Basic],
  ])('should show the data form for secret type %p', (type, expected) => {
    const { typeKey, dataComponent } = (CruSecret as any).computed;
    const key = typeKey.call({ isCloud: false, value: { _type: type } });

    expect(dataComponent.call({ typeKey: key })).toStrictEqual(expected);
  });
});
