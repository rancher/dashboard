import { mount } from '@vue/test-utils';
import ExtensionPanel from '@shell/components/ExtensionPanel.vue';
import { ExtensionPoint, PanelLocation } from '@shell/core/types';

/**
 * A panel as the extension manager hands it back: the registration options plus the
 * locationConfig `_addUIConfig` attaches. An empty locationConfig matches every route.
 */
const panel = (name: string, weight?: number) => ({
  name,
  weight,
  locationConfig: {},
  component:      { name, template: `<div class="test-panel">${ name }</div>` },
});

const route = {
  params: { resource: 'apps.deployment' },
  query:  {},
  hash:   '',
  name:   'c-cluster-product-resource-id',
  meta:   {},
};

/**
 * Mount the panel container over a set of registered panels and report the order they render in.
 *
 * `mount` rather than `shallowMount` here on purpose - the panels are stub components and the
 * assertion is about the order they end up in the DOM, which a shallow render would not show.
 */
const renderedOrder = (panels: ReturnType<typeof panel>[], location = PanelLocation.DETAIL_TOP): string[] => {
  const wrapper = mount(ExtensionPanel, {
    props:  { type: ExtensionPoint.PANEL, location },
    global: { mocks: { $route: route, $extension: { getUIConfig: () => panels } } },
  });

  return wrapper.findAll('.test-panel').map((w) => w.text());
};

describe('component: ExtensionPanel', () => {
  it('should render panels with a higher weight first', () => {
    expect(renderedOrder([
      panel('light', 1),
      panel('heavy', 10),
      panel('negative', -1),
    ])).toStrictEqual(['heavy', 'light', 'negative']);
  });

  it('should treat a panel with no weight as weight zero', () => {
    expect(renderedOrder([
      panel('negative', -1),
      panel('unweighted'),
      panel('heavy', 10),
    ])).toStrictEqual(['heavy', 'unweighted', 'negative']);
  });

  it('should keep the order panels of the same weight were added in', () => {
    expect(renderedOrder([
      panel('first', 5),
      panel('second', 5),
      panel('third', 5),
    ])).toStrictEqual(['first', 'second', 'third']);
  });

  it('should keep the order panels were added in when none of them have a weight', () => {
    expect(renderedOrder([
      panel('first'),
      panel('second'),
      panel('third'),
    ])).toStrictEqual(['first', 'second', 'third']);
  });

  it.each([
    PanelLocation.ABOUT_TOP,
    PanelLocation.DETAILS_MASTHEAD,
    PanelLocation.DETAIL_TOP,
    PanelLocation.RESOURCE_LIST,
  ])('should order panels by weight in the %p location', (location) => {
    expect(renderedOrder([panel('light', 1), panel('heavy', 10)], location)).toStrictEqual(['heavy', 'light']);
  });

  it('should render nothing when no panels are registered', () => {
    const wrapper = mount(ExtensionPanel, {
      props:  { type: ExtensionPoint.PANEL, location: PanelLocation.DETAIL_TOP },
      global: { mocks: { $route: route, $extension: { getUIConfig: () => [] } } },
    });

    expect(wrapper.find('div').exists()).toBe(false);
  });

  it('should render nothing when the extension manager is not available', () => {
    const wrapper = mount(ExtensionPanel, {
      props:  { type: ExtensionPoint.PANEL, location: PanelLocation.DETAIL_TOP },
      global: { mocks: { $route: route } },
    });

    expect(wrapper.find('div').exists()).toBe(false);
  });

  it('should pass the resource to each panel component', () => {
    const resource = { id: 'some-deployment' };
    const component = {
      name:     'resource-panel',
      props:    { resource: { type: Object, default: null } },
      template: '<div class="test-panel">{{ resource.id }}</div>',
    };

    const wrapper = mount(ExtensionPanel, {
      props: {
        type: ExtensionPoint.PANEL, location: PanelLocation.DETAIL_TOP, resource
      },
      global: {
        mocks: {
          $route:     route,
          $extension: { getUIConfig: () => [{ locationConfig: {}, component }] },
        },
      },
    });

    expect(wrapper.find('.test-panel').text()).toBe('some-deployment');
  });
});
