import { mount } from '@vue/test-utils';

import ResourceDetail from '@shell/components/ResourceDetail/index.vue';
import { _EDIT, _VIEW, LEGACY, MODE } from '@shell/config/query-params';
import flushPromises from 'flush-promises';

const mockQuery: any = {};
const mockParams: any = {};

jest.mock('@shell/components/ResourceDetail/legacy.vue', () => ({
  template: '<div class="legacy">Legacy</div>',
  name:     'Legacy',
  props:    ['flexContent', 'componentTestId', 'storeOverride', 'resourceOverride', 'parentRouteOverride', 'errorsMap']
}));

jest.mock('@shell/components/Loading.vue', () => ({
  template: '<div class="loading">Loading</div>',
  name:     'Loading'
}));

jest.mock('@shell/pages/explorer/resource/detail/configmap.vue', () => ({
  template: '<div class="configmap">configmap</div>',
  name:     'configmap',
}));

jest.mock('vue-router', () => ({
  useRoute: () => ({
    query:  mockQuery,
    params: mockParams
  })
}));

describe('component: ResourceDetail/index', () => {
  const resourceName = 'configmap';

  it('should render legacy component with default props if LEGACY=false is not present', async() => {
    mockParams.resource = resourceName;
    mockQuery[MODE] = _VIEW;

    const wrapper = mount(ResourceDetail, { });
    const legacyComponent = wrapper.findComponent<any>({ name: 'Legacy' });

    expect(legacyComponent.props('flexContent')).toStrictEqual(false);
    expect(legacyComponent.props('componentTestId')).toStrictEqual('resource-details');
    expect(legacyComponent.props('storeOverride')).toBeUndefined();
    expect(legacyComponent.props('resourceOverride')).toBeUndefined();
    expect(legacyComponent.props('parentRouteOverride')).toBeUndefined();
    expect(legacyComponent.props('errorsMap')).toBeUndefined();
  });

  it('should render legacy component with default props if LEGACY=false is present but resourceName has not been added to our mapping', async() => {
    mockParams.resource = 'notMapped';
    mockQuery[MODE] = _VIEW;

    const wrapper = mount(ResourceDetail, {});
    const legacyComponent = wrapper.findComponent<any>({ name: 'Legacy' });

    expect(legacyComponent.exists()).toBeTruthy();
  });

  it('should render legacy component with default props if LEGACY=false is present but mode is not VIEW', async() => {
    mockParams.resource = resourceName;
    mockQuery[MODE] = _EDIT;

    const wrapper = mount(ResourceDetail, {});
    const legacyComponent = wrapper.findComponent<any>({ name: 'Legacy' });

    expect(legacyComponent.exists()).toBeTruthy();
  });

  it('should render legacy component while forwarding props', async() => {
    mockParams.resource = resourceName;
    mockQuery[MODE] = _VIEW;

    const flexContent = true;
    const componentTestId = 'componentTestId';
    const storeOverride = 'storeOverride';
    const resourceOverride = 'resourceOverride';
    const parentRouteOverride = 'parentRouteOverride';
    const errorsMap = { error: 'test' };

    const wrapper = mount(ResourceDetail, {
      props: {
        flexContent,
        componentTestId,
        storeOverride,
        resourceOverride,
        parentRouteOverride,
        errorsMap,
      }
    });
    const legacyComponent = wrapper.findComponent<any>({ name: 'Legacy' });

    expect(legacyComponent.props('flexContent')).toStrictEqual(flexContent);
    expect(legacyComponent.props('componentTestId')).toStrictEqual(componentTestId);
    expect(legacyComponent.props('storeOverride')).toStrictEqual(storeOverride);
    expect(legacyComponent.props('resourceOverride')).toStrictEqual(resourceOverride);
    expect(legacyComponent.props('parentRouteOverride')).toStrictEqual(parentRouteOverride);
    expect(legacyComponent.props('errorsMap')).toStrictEqual(errorsMap);
  });

  it('should render new component if LEGACY=false is present', async() => {
    mockParams.resource = resourceName;
    mockQuery[MODE] = _VIEW;
    mockQuery[LEGACY] = 'false';

    const wrapper = mount(ResourceDetail);

    await flushPromises();
    const configmapComponent = wrapper.findComponent<any>({ name: 'configmap' });

    expect(configmapComponent.exists()).toBeTruthy();
  });
});
