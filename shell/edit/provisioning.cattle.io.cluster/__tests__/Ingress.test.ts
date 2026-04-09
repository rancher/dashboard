import { mount } from '@vue/test-utils';
import Ingress from '@shell/edit/provisioning.cattle.io.cluster/tabs/Ingress.vue';
import { _EDIT } from '@shell/config/query-params';
import { INGRESS_DUAL, TRAEFIK, INGRESS_NGINX, INGRESS_NONE } from '@shell/edit/provisioning.cattle.io.cluster/shared';

jest.mock('vuex', () => ({
  useStore:   () => ({ getters: { 'i18n/t': (key: string) => key } }),
  mapGetters: () => ({ t: (key: string) => key })
}));

jest.mock('@shell/edit/provisioning.cattle.io.cluster/shared', () => ({

  INGRESS_NGINX:   'ingress-nginx',
  TRAEFIK:         'traefik',
  INGRESS_DUAL:    'dual',
  INGRESS_NONE:    'none',
  INGRESS_OPTIONS: [{
    id:        'traefik',
    image:     { src: '', alt: 'Traefik' },
    header:    { title: { key: 'cluster.ingress.traefik.header' } },
    subHeader: { label: { key: 'cluster.ingress.recommended' } },
    content:   { key: 'cluster.ingress.traefik.content' },
    doc:       { url: 'https://docs.rke2.io/networking/networking_services?_highlight=ingress#ingress-controller' }
  },
  {
    id:        'ingress-nginx',
    image:     { src: '', alt: 'NGINX' },
    header:    { title: { key: 'cluster.ingress.nginx.header' } },
    subHeader: { label: { key: 'cluster.ingress.legacy' } },
    content:   { key: 'cluster.ingress.nginx.content' },
    doc:       { url: 'https://www.kubernetes.dev/blog/2025/11/12/ingress-nginx-retirement/' }
  },
  {
    id:        'dual',
    header:    { title: { key: 'cluster.ingress.dual.header' } },
    subHeader: { label: { key: 'cluster.ingress.migration' } },
    content:   { key: 'cluster.ingress.dual.content' }
  }],
  INGRESS_MIGRATION_KB_LINK:          'mock-link',
  INGRESS_CONTROLLER_CLASS_MIGRATION: 'rke2.cattle.io/ingress-nginx-migration',
  INGRESS_CLASS_DEFAULT:              'rke2.cattle.io/ingress-nginx-default',
  INGRESS_CONTROLLER_CLASS_DEFAULT:   'rke2.cattle.io/ingress-nginx-controller-default',
  INGRESS_CLASS_MIGRATION:            'rke2.cattle.io/ingress-nginx-migration'
}));

describe('ingress.vue', () => {
  const defaultProps = {
    mode:             _EDIT,
    value:            INGRESS_NONE,
    nginxSupported:   true,
    traefikSupported: true,
    nginxChart:       'rancher-ingress-nginx',
    traefikChart:     'traefik',
    userChartValues:  {},
    versionInfo:      {
      'rancher-ingress-nginx': { values: {} },
      traefik:                 { values: {} }
    }
  };

  const createWrapper = (props = {}) => mount(Ingress, {
    props:  { ...defaultProps, ...props },
    global: {
      stubs: {
        Checkbox:             true,
        Banner:               true,
        IngressCards:         true,
        IngressConfiguration: true,
        YamlEditor:           true,
        RichTranslation:      true
      }
    }
  });

  it('renders checkbox to enable/disable ingress', () => {
    const wrapper = createWrapper();
    const checkbox = wrapper.findComponent({ name: 'Checkbox' });

    expect(checkbox.exists()).toBe(true);
  });

  it('emits update:value with INGRESS_NONE when ingress is disabled', async() => {
    const wrapper = createWrapper({ value: TRAEFIK });
    const checkbox = wrapper.findComponent({ name: 'Checkbox' });

    await checkbox.vm.$emit('update:value', false);

    expect(wrapper.emitted('update:value')).toBeTruthy();
    expect(wrapper.emitted('update:value')?.[0]).toStrictEqual([INGRESS_NONE]);
  });

  it('emits update:value with TRAEFIK when ingress is enabled and traefik is supported', async() => {
    const wrapper = createWrapper({ value: INGRESS_NONE });
    const checkbox = wrapper.findComponent({ name: 'Checkbox' });

    await checkbox.vm.$emit('update:value', true);

    expect(wrapper.emitted('update:value')).toBeTruthy();
    expect(wrapper.emitted('update:value')?.[0]).toStrictEqual([TRAEFIK]);
  });

  it('emits update:value with INGRESS_NGINX when ingress is enabled, traefik is NOT supported, and nginx IS supported', async() => {
    const wrapper = createWrapper({ value: INGRESS_NONE, traefikSupported: false });
    const checkbox = wrapper.findComponent({ name: 'Checkbox' });

    await checkbox.vm.$emit('update:value', true);

    expect(wrapper.emitted('update:value')).toBeTruthy();
    expect(wrapper.emitted('update:value')?.[0]).toStrictEqual([INGRESS_NGINX]);
  });

  it('selectIngress emits [INGRESS_NGINX, TRAEFIK] string value when INGRESS_DUAL is selected and previous value was ingress-nginx', () => {
    const wrapper = createWrapper({ value: INGRESS_NGINX, originalIngressController: INGRESS_NGINX });
    const ingressCards = wrapper.findComponent({ name: 'IngressCards' });

    ingressCards.vm.$emit('select', INGRESS_DUAL);

    expect(wrapper.emitted('update:value')).toBeTruthy();
    expect(wrapper.emitted('update:value')?.[0]).toStrictEqual([[INGRESS_NGINX, TRAEFIK]]);
  });

  it('selectIngress emits [TRAEFIK, INGRESS_NGINX] string value when INGRESS_DUAL is selected and previous value was traefik', () => {
    const wrapper = createWrapper({ value: TRAEFIK, originalIngressController: TRAEFIK });
    const ingressCards = wrapper.findComponent({ name: 'IngressCards' });

    ingressCards.vm.$emit('select', INGRESS_DUAL);

    expect(wrapper.emitted('update:value')).toBeTruthy();
    expect(wrapper.emitted('update:value')?.[0]).toStrictEqual([[TRAEFIK, INGRESS_NGINX]]);
  });

  it('selectIngress emits [TRAEFIK, INGRESS_NGINX] string value when INGRESS_DUAL is selected and  value went traefik -> nginx -> dual', () => {
    const wrapper = createWrapper({ value: TRAEFIK, originalIngressController: TRAEFIK });
    const ingressCards = wrapper.findComponent({ name: 'IngressCards' });

    ingressCards.vm.$emit('select', INGRESS_NGINX);
    expect(wrapper.emitted('update:value')).toBeTruthy();
    expect(wrapper.emitted('update:value')?.[0]).toStrictEqual([INGRESS_NGINX]);

    ingressCards.vm.$emit('select', INGRESS_DUAL);

    expect(wrapper.emitted('update:value')).toBeTruthy();
    expect(wrapper.emitted('update:value')?.[1]).toStrictEqual([[TRAEFIK, INGRESS_NGINX]]);
  });

  it('selectIngress emits string value when a single ingress is selected', () => {
    const wrapper = createWrapper({ value: TRAEFIK });
    const ingressCards = wrapper.findComponent({ name: 'IngressCards' });

    ingressCards.vm.$emit('select', INGRESS_NGINX);

    expect(wrapper.emitted('update:value')).toBeTruthy();
    expect(wrapper.emitted('update:value')?.[0]).toStrictEqual([INGRESS_NGINX]);
  });

  it('renders IngressConfiguration when versionInfo contains chart values', () => {
    const wrapper = createWrapper({ value: TRAEFIK });
    const config = wrapper.findComponent({ name: 'IngressConfiguration' });

    expect(config.exists()).toBe(true);
  });

  it('toggles advanced configuration visibility and renders YamlEditor', async() => {
    const wrapper = createWrapper({ value: TRAEFIK });

    expect(wrapper.findComponent({ name: 'YamlEditor' }).exists()).toBe(false);

    const advancedButton = wrapper.find('.advanced-toggle');

    await advancedButton.trigger('click');

    const yamlEditor = wrapper.find('[data-testid="traefik-yaml-editor"]');

    expect(yamlEditor.exists()).toBe(true);
  });
});
