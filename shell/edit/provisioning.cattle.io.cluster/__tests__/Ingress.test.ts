import { mount } from '@vue/test-utils';
import Ingress from '@shell/edit/provisioning.cattle.io.cluster/ingress/index.vue';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import { INGRESS_DUAL, TRAEFIK, INGRESS_NGINX, INGRESS_NONE } from '@shell/edit/provisioning.cattle.io.cluster/shared';

jest.mock('vuex', () => ({
  useStore:   () => ({ getters: { 'i18n/t': (key: string) => key } }),
  mapGetters: () => ({ t: (key: string) => key })
}));

jest.mock('@components/Banner', () => ({
  Banner: {
    name:     'Banner',
    template: '<div class="banner-stub"></div>',
    props:    ['color', 'labelKey']
  }
}));

jest.mock('@shell/components/YamlEditor', () => {
  const EDITOR_MODES = { VIEW_CODE: 'VIEW_CODE', EDIT_CODE: 'EDIT_CODE' };
  const YamlEditor = {
    name:     'YamlEditor',
    template: '<div class="yaml-editor-stub"></div>',
    props:    ['value', 'mode', 'scrolling', 'asObject', 'editorMode', 'hidePreviewButtons'],
    methods:  { updateValue: jest.fn() }
  };

  return {
    __esModule: true, default: YamlEditor, EDITOR_MODES
  };
});

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
    id:                 'ingress-nginx',
    image:              { src: '', alt: 'NGINX' },
    header:             { title: { key: 'cluster.ingress.nginx.header' } },
    subHeader:          { label: { key: 'cluster.ingress.legacy' } },
    unsupportedContent: { key: 'cluster.ingress.nginx.contentUnsupported' },
    content:            { key: 'cluster.ingress.nginx.content' },
    doc:                { url: 'https://www.kubernetes.dev/blog/2025/11/12/ingress-nginx-retirement/' }
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

// Payload of the component's `update:value` event: one ingress controller id, or the pair
// of them when the dual option is picked.
type IngressValue = string | string[];

// Payload of the component's `update-values` event: a chart name and that chart's values.
type UpdateValuesPayload = [chart: string, values: { providers?: Record<string, unknown> }];

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
        IngressCards:         true,
        IngressConfiguration: true,
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
    const emitted = wrapper.emitted('update:value') as [IngressValue][];

    expect(emitted[0]).toStrictEqual([INGRESS_NONE]);
  });

  it('emits update:value with TRAEFIK when ingress is enabled and traefik is supported', async() => {
    const wrapper = createWrapper({ value: INGRESS_NONE });
    const checkbox = wrapper.findComponent({ name: 'Checkbox' });

    await checkbox.vm.$emit('update:value', true);

    expect(wrapper.emitted('update:value')).toBeTruthy();
    const emitted = wrapper.emitted('update:value') as [IngressValue][];

    expect(emitted[0]).toStrictEqual([TRAEFIK]);
  });

  it('emits update:value with INGRESS_NGINX when ingress is enabled, traefik is NOT supported, and nginx IS supported', async() => {
    const wrapper = createWrapper({ value: INGRESS_NONE, traefikSupported: false });
    const checkbox = wrapper.findComponent({ name: 'Checkbox' });

    await checkbox.vm.$emit('update:value', true);

    expect(wrapper.emitted('update:value')).toBeTruthy();
    const emitted = wrapper.emitted('update:value') as [IngressValue][];

    expect(emitted[0]).toStrictEqual([INGRESS_NGINX]);
  });

  it('does not enable nginx on Kubernetes 1.37 when Traefik is unavailable', async() => {
    const wrapper = createWrapper({
      value: INGRESS_NONE, traefikSupported: false, kubernetesVersion: 'v1.37.0+rke2r1'
    });

    await wrapper.findComponent({ name: 'Checkbox' }).vm.$emit('update:value', true);

    expect(wrapper.emitted('update:value')).toStrictEqual([[INGRESS_NONE]]);
  });

  it('selectIngress emits [INGRESS_NGINX, TRAEFIK] string value when INGRESS_DUAL is selected and previous value was ingress-nginx', () => {
    const wrapper = createWrapper({ value: INGRESS_NGINX, originalIngressController: INGRESS_NGINX });
    const ingressCards = wrapper.findComponent({ name: 'IngressCards' });

    ingressCards.vm.$emit('select', INGRESS_DUAL);

    expect(wrapper.emitted('update:value')).toBeTruthy();
    const emitted = wrapper.emitted('update:value') as [IngressValue][];

    expect(emitted[0]).toStrictEqual([[INGRESS_NGINX, TRAEFIK]]);
  });

  it('selectIngress emits [TRAEFIK, INGRESS_NGINX] string value when INGRESS_DUAL is selected and previous value was traefik', () => {
    const wrapper = createWrapper({ value: TRAEFIK, originalIngressController: TRAEFIK });
    const ingressCards = wrapper.findComponent({ name: 'IngressCards' });

    ingressCards.vm.$emit('select', INGRESS_DUAL);

    expect(wrapper.emitted('update:value')).toBeTruthy();
    const emitted = wrapper.emitted('update:value') as [IngressValue][];

    expect(emitted[0]).toStrictEqual([[TRAEFIK, INGRESS_NGINX]]);
  });

  it('selectIngress emits [TRAEFIK, INGRESS_NGINX] string value when INGRESS_DUAL is selected and  value went traefik -> nginx -> dual', () => {
    const wrapper = createWrapper({ value: TRAEFIK, originalIngressController: TRAEFIK });
    const ingressCards = wrapper.findComponent({ name: 'IngressCards' });

    ingressCards.vm.$emit('select', INGRESS_NGINX);
    expect(wrapper.emitted('update:value')).toBeTruthy();
    const emitted = wrapper.emitted('update:value') as [IngressValue][];

    expect(emitted[0]).toStrictEqual([INGRESS_NGINX]);

    ingressCards.vm.$emit('select', INGRESS_DUAL);

    expect(wrapper.emitted('update:value')).toBeTruthy();
    const emittedAfterDual = wrapper.emitted('update:value') as [IngressValue][];

    expect(emittedAfterDual[1]).toStrictEqual([[TRAEFIK, INGRESS_NGINX]]);
  });

  it('selectIngress emits string value when a single ingress is selected', () => {
    const wrapper = createWrapper({ value: TRAEFIK });
    const ingressCards = wrapper.findComponent({ name: 'IngressCards' });

    ingressCards.vm.$emit('select', INGRESS_NGINX);

    expect(wrapper.emitted('update:value')).toBeTruthy();
    const emitted = wrapper.emitted('update:value') as [IngressValue][];

    expect(emitted[0]).toStrictEqual([INGRESS_NGINX]);
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

  describe('traefikNginxKey', () => {
    it('uses kubernetesIngressNginx when traefik chart version is below 40.0.0', () => {
      const wrapper = createWrapper({
        value:       TRAEFIK,
        versionInfo: {
          'rancher-ingress-nginx': { values: {} },
          traefik:                 { chart: { version: '34.2.002' }, values: { providers: {} } }
        }
      });
      const ingressCards = wrapper.findComponent({ name: 'IngressCards' });

      ingressCards.vm.$emit('select', INGRESS_DUAL);

      const emitted = wrapper.emitted('update-values') as UpdateValuesPayload[] | undefined;

      expect(emitted).toBeTruthy();
      const traefikValues = emitted?.find((e) => e[0] === 'traefik')?.[1];

      expect(traefikValues?.providers?.kubernetesIngressNginx).toBeDefined();
      expect(traefikValues?.providers?.kubernetesIngressNGINX).toBeUndefined();
    });

    it('uses kubernetesIngressNGINX when traefik chart version is 40.0.0 or above', () => {
      const wrapper = createWrapper({
        value:       TRAEFIK,
        versionInfo: {
          'rancher-ingress-nginx': { values: {} },
          traefik:                 { chart: { version: '40.1.003' }, values: { providers: {} } }
        }
      });
      const ingressCards = wrapper.findComponent({ name: 'IngressCards' });

      ingressCards.vm.$emit('select', INGRESS_DUAL);

      const emitted = wrapper.emitted('update-values') as UpdateValuesPayload[] | undefined;

      expect(emitted).toBeTruthy();
      const traefikValues = emitted?.find((e) => e[0] === 'traefik')?.[1];

      expect(traefikValues?.providers?.kubernetesIngressNGINX).toBeDefined();
      expect(traefikValues?.providers?.kubernetesIngressNginx).toBeUndefined();
    });

    it('defaults to kubernetesIngressNGINX when no chart version is available', () => {
      const wrapper = createWrapper({
        value:       TRAEFIK,
        versionInfo: {
          'rancher-ingress-nginx': { values: {} },
          traefik:                 { values: { providers: {} } }
        }
      });
      const ingressCards = wrapper.findComponent({ name: 'IngressCards' });

      ingressCards.vm.$emit('select', INGRESS_DUAL);

      const emitted = wrapper.emitted('update-values') as UpdateValuesPayload[] | undefined;

      expect(emitted).toBeTruthy();
      const traefikValues = emitted?.find((e) => e[0] === 'traefik')?.[1];

      expect(traefikValues?.providers?.kubernetesIngressNGINX).toBeDefined();
      expect(traefikValues?.providers?.kubernetesIngressNginx).toBeUndefined();
    });

    it('migrates values from kubernetesIngressNginx to kubernetesIngressNGINX when version changes from below v40 to above v40', async() => {
      const wrapper = createWrapper({
        value:           TRAEFIK,
        userChartValues: { traefik: { providers: { kubernetesIngressNginx: { enabled: true, ingressClass: 'test' } } } },
        versionInfo:     {
          'rancher-ingress-nginx': { values: {} },
          traefik:                 { chart: { version: '34.2.002' }, values: { providers: { kubernetesIngressNginx: { enabled: true, ingressClass: 'test' } } } }
        }
      });

      // Now update versionInfo to a version >= 40.0.0
      await wrapper.setProps({
        versionInfo: {
          'rancher-ingress-nginx': { values: {} },
          traefik:                 { chart: { version: '40.1.003' }, values: { providers: {} } }
        }
      });

      // Watcher migrates key and emits because userChartValues had saved values under the old key
      const emitted = wrapper.emitted('update-values') as UpdateValuesPayload[];
      const lastEmit = emitted[emitted.length - 1];

      expect(lastEmit[0]).toBe('traefik');
      expect(lastEmit[1]?.providers?.kubernetesIngressNGINX).toBeDefined();
      expect(lastEmit[1]?.providers?.kubernetesIngressNginx).toBeUndefined();
    });

    it('migrates values from kubernetesIngressNGINX to kubernetesIngressNginx when version changes from above v40 to below v40', async() => {
      const wrapper = createWrapper({
        value:           TRAEFIK,
        userChartValues: { traefik: { providers: { kubernetesIngressNGINX: { enabled: true, ingressClass: 'test' } } } },
        versionInfo:     {
          'rancher-ingress-nginx': { values: {} },
          traefik:                 { chart: { version: '40.1.003' }, values: { providers: { kubernetesIngressNGINX: { enabled: true, ingressClass: 'test' } } } }
        }
      });

      // Now update versionInfo to a version < 40.0.0
      await wrapper.setProps({
        versionInfo: {
          'rancher-ingress-nginx': { values: {} },
          traefik:                 { chart: { version: '34.2.002' }, values: { providers: {} } }
        }
      });

      // Watcher migrates key and emits because userChartValues had saved values under the old key
      const emitted = wrapper.emitted('update-values') as UpdateValuesPayload[];
      const lastEmit = emitted[emitted.length - 1];

      expect(lastEmit[0]).toBe('traefik');
      expect(lastEmit[1]?.providers?.kubernetesIngressNginx).toBeDefined();
      expect(lastEmit[1]?.providers?.kubernetesIngressNGINX).toBeUndefined();
    });

    it('does not emit update-values when version changes but no saved user values exist under the old key', async() => {
      const wrapper = createWrapper({
        value:       TRAEFIK,
        versionInfo: {
          'rancher-ingress-nginx': { values: {} },
          traefik:                 { chart: { version: '40.1.003' }, values: { providers: {} } }
        }
      });

      // Switch to older version - no userChartValues saved, so watcher should NOT emit
      await wrapper.setProps({
        versionInfo: {
          'rancher-ingress-nginx': { values: {} },
          traefik:                 { chart: { version: '34.2.002' }, values: { providers: {} } }
        }
      });

      const emitted = wrapper.emitted('update-values');

      expect(emitted).toBeFalsy();
    });
  });

  describe('ingress-nginx restriction for Kubernetes 1.37', () => {
    const nginxOption = (props = {}) => {
      const wrapper = createWrapper({ value: TRAEFIK, ...props });
      const options = wrapper.findComponent({ name: 'IngressCards' }).props('options') as any[];

      return options.find((o) => o.id === INGRESS_NGINX);
    };

    it('omits the nginx card when creating a cluster with k8s >= v1.37.0', () => {
      const wrapper = createWrapper({
        value: TRAEFIK, mode: _CREATE, kubernetesVersion: 'v1.37.0+rke2r1'
      });
      const options = wrapper.findComponent({ name: 'IngressCards' }).props('options') as any[];

      expect(options.map((option) => option.id)).toStrictEqual([TRAEFIK]);
    });

    it('updates the create options when the Kubernetes version changes', async() => {
      const wrapper = createWrapper({
        value: TRAEFIK, mode: _CREATE, kubernetesVersion: 'v1.36.0+rke2r1'
      });
      const cards = wrapper.findComponent({ name: 'IngressCards' });

      expect((cards.props('options') as any[]).map((option) => option.id)).toStrictEqual([TRAEFIK, INGRESS_NGINX]);

      await wrapper.setProps({ kubernetesVersion: 'v1.37.0+rke2r1' });

      expect((cards.props('options') as any[]).map((option) => option.id)).toStrictEqual([TRAEFIK]);
    });

    it('leaves the nginx card enabled with the default content/doc when k8s is below v1.37.0', () => {
      const nginx = nginxOption({ mode: _CREATE, kubernetesVersion: 'v1.36.0+rke2r1' });

      expect(nginx.disabled).toBe(false);
      expect(nginx.content).toStrictEqual({ key: 'cluster.ingress.nginx.content' });
      expect(nginx.doc).toStrictEqual({ url: 'https://www.kubernetes.dev/blog/2025/11/12/ingress-nginx-retirement/' });
    });

    it('disables the nginx card when editing a cluster targeting k8s >= v1.37.0', () => {
      const nginx = nginxOption({ mode: _EDIT, kubernetesVersion: 'v1.37.0+rke2r1' });

      expect(nginx.disabled).toBe(true);
      expect(nginx.content).toStrictEqual({ key: 'cluster.ingress.nginx.contentUnsupported' });
    });

    it('keeps dual mode available when editing a cluster targeting k8s >= v1.37.0', () => {
      const wrapper = createWrapper({
        value: [INGRESS_NGINX, TRAEFIK], mode: _EDIT, kubernetesVersion: 'v1.37.0+rke2r1'
      });
      const options = wrapper.findComponent({ name: 'IngressCards' }).props('options') as any[];

      expect(options.find((o) => o.id === INGRESS_DUAL).disabled).toBe(false);
    });

    it.each([
      ['nginx moving to traefik', INGRESS_NGINX, TRAEFIK, 'v1.36.0+rke2r1', true],
      ['nginx moving to dual', INGRESS_NGINX, [INGRESS_NGINX, TRAEFIK], 'v1.36.0+rke2r1', true],
      ['dual staying dual', [INGRESS_NGINX, TRAEFIK], [INGRESS_NGINX, TRAEFIK], 'v1.36.0+rke2r1', true],
      ['dual moving to traefik', [INGRESS_NGINX, TRAEFIK], TRAEFIK, 'v1.36.0+rke2r1', true],
      ['traefik staying traefik', TRAEFIK, TRAEFIK, 'v1.36.0+rke2r1', false],
      ['none staying none', INGRESS_NONE, INGRESS_NONE, 'v1.36.0+rke2r1', false],
      ['dual already on 1.37', [INGRESS_NGINX, TRAEFIK], [INGRESS_NGINX, TRAEFIK], 'v1.37.0+rke2r1', false],
      ['dual with no previous version', [INGRESS_NGINX, TRAEFIK], [INGRESS_NGINX, TRAEFIK], undefined, false],
    ])('upgrade warning for %s: %p', (_, originalIngressController, value, previousKubeVersion, expected) => {
      const wrapper = createWrapper({
        value, originalIngressController, previousKubeVersion, mode: _EDIT, kubernetesVersion: 'v1.37.0+rke2r1'
      });
      const banners = wrapper.findAllComponents({ name: 'Banner' });

      expect(banners.some((banner) => banner.props('labelKey') === 'cluster.ingress.banners.nginxUpgradeWarning.label')).toBe(expected);
    });

    it('does not show the upgrade warning when the target version is below v1.37.0', () => {
      const wrapper = createWrapper({
        value: TRAEFIK, originalIngressController: INGRESS_NGINX, previousKubeVersion: 'v1.35.0+rke2r1', mode: _EDIT, kubernetesVersion: 'v1.36.0+rke2r1'
      });
      const banners = wrapper.findAllComponents({ name: 'Banner' });

      expect(banners.some((banner) => banner.props('labelKey') === 'cluster.ingress.banners.nginxUpgradeWarning.label')).toBe(false);
    });

    it('shows the blocking message when an edited cluster still uses standalone nginx', () => {
      const wrapper = createWrapper({
        value: INGRESS_NGINX, mode: _EDIT, kubernetesVersion: 'v1.37.0+rke2r1'
      });
      const banners = wrapper.findAllComponents({ name: 'Banner' });

      expect(banners.some((banner) => banner.props('labelKey') === 'cluster.ingress.banners.nginxUpgradeBlocked.label')).toBe(true);
    });

    it('ignores selection of disabled nginx on k8s >= v1.37.0', async() => {
      const wrapper = createWrapper({
        value: TRAEFIK, mode: _EDIT, kubernetesVersion: 'v1.37.0+rke2r1'
      });

      await wrapper.findComponent({ name: 'IngressCards' }).vm.$emit('select', INGRESS_NGINX);

      expect(wrapper.emitted('update:value')).toBeUndefined();
    });

    it('disables every card in view mode', () => {
      const wrapper = createWrapper({ value: TRAEFIK, mode: _VIEW });
      const options = wrapper.findComponent({ name: 'IngressCards' }).props('options') as any[];

      expect(options.every((o) => o.disabled)).toBe(true);
    });
  });
});
