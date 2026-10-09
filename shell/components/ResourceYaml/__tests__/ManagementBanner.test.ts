import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils';
import ManagementBanner from '@shell/components/ResourceYaml/ManagementBanner.vue';

// rendered components from pkg/rancher-components resolve a different copy of vue than shell
jest.mock('@components/Banner', () => ({
  Banner: {
    name: 'BannerStub', props: ['color'], template: '<div><slot /></div>'
  }
}));

// renders the `manager` slot in place of the `<manager/>` tag of the translation
jest.mock('@shell/components/RichTranslation.vue', () => ({
  __esModule: true,
  default:    {
    name: 'RichTranslationStub', props: ['k'], template: '<span><slot name="manager" /></span>'
  },
}));

const mockFindManager = jest.fn();

jest.mock('@shell/utils/related-resources/management', () => ({
  ...jest.requireActual('@shell/utils/related-resources/management'),
  findManager: (...args: any[]) => mockFindManager(...args),
}));

const CONTROLLED = {
  type:     'apps.replicaset',
  metadata: {
    name:            'web-1',
    namespace:       'ns',
    ownerReferences: [{
      apiVersion: 'apps/v1', kind: 'Deployment', name: 'web', controller: true
    }]
  }
};

const HELM = {
  type:     'apps.deployment',
  metadata: {
    name: 'traefik', namespace: 'kube-system', annotations: { 'meta.helm.sh/release-name': 'traefik', 'meta.helm.sh/release-namespace': 'kube-system' }
  }
};

const FLEET = { ...HELM, metadata: { ...HELM.metadata, annotations: { ...HELM.metadata.annotations, 'objectset.rio.cattle.io/id': 'default-traefik' } } };

const RANCHER = {
  type:     'fleet.cattle.io.bundle',
  metadata: {
    name: 'fleet-agent-local', namespace: 'fleet-local', annotations: { 'objectset.rio.cattle.io/owner-gvk': '/v1, Kind=Namespace', 'objectset.rio.cattle.io/owner-name': 'fleet-local' }
  }
};

const HELM_RECORD = {
  type:     'secret',
  metadata: {
    name: 'sh.helm.release.v1.traefik.v1', namespace: 'kube-system', labels: { owner: 'helm', name: 'traefik' }
  }
};

describe('component: ManagementBanner', () => {
  beforeEach(() => {
    mockFindManager.mockReset();
    mockFindManager.mockResolvedValue(null);
  });

  const mountComponent = (resource: any, readOnly = false, primaryResource?: any) => mount(ManagementBanner, {
    props: {
      resource, readOnly, primaryResource
    },
    global: { stubs: { RouterLink: RouterLinkStub } },
  });

  const banner = (wrapper: ReturnType<typeof mountComponent>) => wrapper.findComponent({ name: 'BannerStub' });
  const messageKey = (wrapper: ReturnType<typeof mountComponent>) => wrapper.findComponent({ name: 'RichTranslationStub' }).props('k');

  it('should show nothing for a resource nothing else writes', () => {
    const wrapper = mountComponent({ type: 'configmap', metadata: { name: 'a', namespace: 'ns' } });

    expect(banner(wrapper).exists()).toBe(false);
    expect(mockFindManager).toHaveBeenCalledTimes(0);
  });

  it.each([
    ['a controlled', CONTROLLED, 'resourceYaml.management.controller', 'Deployment web'],
    ['a rancher applied', RANCHER, 'resourceYaml.management.rancher', 'Namespace fleet-local'],
    ['a fleet deployed', FLEET, 'resourceYaml.management.fleet', 'kube-system/traefik'],
    ['a helm installed', HELM, 'resourceYaml.management.helm', 'kube-system/traefik'],
    ['the helm release Secret of a', HELM_RECORD, 'resourceYaml.management.helmRecord', 'kube-system/traefik'],
  ])('should warn about %s resource, naming what writes it', (_label, resource, key, label) => {
    const wrapper = mountComponent(resource);

    expect(banner(wrapper).props('color')).toBe('warning');
    expect(messageKey(wrapper)).toBe(key);
    expect(wrapper.text()).toBe(label);
  });

  it('should say why a read-only controlled resource is read-only', () => {
    const wrapper = mountComponent(CONTROLLED, true);

    expect(banner(wrapper).props('color')).toBe('info');
    expect(messageKey(wrapper)).toBe('resourceYaml.management.controllerReadOnly');
  });

  it.each([
    ['rancher applied', RANCHER],
    ['fleet deployed', FLEET],
    ['helm installed', HELM],
  ])('should show nothing for a read-only %s resource', (_label, resource) => {
    const wrapper = mountComponent(resource, true);

    expect(banner(wrapper).exists()).toBe(false);
  });

  it('should link to what writes the resource, in a new tab, once it is found', async() => {
    const detailLocation = { name: 'c-cluster-product-resource-namespace-id', params: { id: 'web' } };

    mockFindManager.mockResolvedValue({ detailLocation });

    const wrapper = mountComponent(CONTROLLED);

    expect(mockFindManager).toHaveBeenCalledWith(CONTROLLED, { by: 'controller', owner: CONTROLLED.metadata.ownerReferences[0] });

    await flushPromises();

    const link = wrapper.findComponent(RouterLinkStub);

    expect(link.props('to')).toStrictEqual(detailLocation);
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toBe('noopener noreferrer');
    expect(link.text()).toBe('Deployment web');
  });

  // the Deployment is open in the editor, with its ReplicaSet selected
  it('should name the resource being edited without a link, where it writes the selected resource', async() => {
    mockFindManager.mockResolvedValue({
      type: 'apps.deployment', id: 'ns/web', detailLocation: { name: 'web' }
    });

    const wrapper = mountComponent(CONTROLLED, true, { type: 'apps.deployment', id: 'ns/web' });

    await flushPromises();

    expect(wrapper.findComponent(RouterLinkStub).exists()).toBe(false);
    expect(wrapper.text()).toBe('Deployment web');
  });

  it('should link to what writes the selected resource where it is not the resource being edited', async() => {
    mockFindManager.mockResolvedValue({
      type: 'apps.deployment', id: 'ns/web', detailLocation: { name: 'web' }
    });

    const wrapper = mountComponent(CONTROLLED, true, { type: 'apps.deployment', id: 'ns/other' });

    await flushPromises();

    expect(wrapper.findComponent(RouterLinkStub).props('to')).toStrictEqual({ name: 'web' });
  });

  it.each([
    ['is not found', () => Promise.resolve(null)],
    ['can not be fetched', () => Promise.reject(new Error('nope'))],
  ])('should name what writes the resource without a link where it %s', async(_label, find) => {
    mockFindManager.mockImplementation(find);

    const wrapper = mountComponent(HELM);

    await flushPromises();

    expect(wrapper.findComponent(RouterLinkStub).exists()).toBe(false);
    expect(wrapper.text()).toBe('kube-system/traefik');
  });

  it('should keep the link of the current resource when the fetch for a previous one finishes later', async() => {
    let resolveFirst: (value: any) => void = () => {};

    mockFindManager
      .mockImplementationOnce(() => new Promise((resolve) => {
        resolveFirst = resolve;
      }))
      .mockResolvedValueOnce({ detailLocation: { name: 'second' } });

    const wrapper = mountComponent(CONTROLLED);

    await wrapper.setProps({ resource: HELM });
    await flushPromises();

    resolveFirst({ detailLocation: { name: 'first' } });
    await flushPromises();

    expect(wrapper.findComponent(RouterLinkStub).props('to')).toStrictEqual({ name: 'second' });
  });
});
