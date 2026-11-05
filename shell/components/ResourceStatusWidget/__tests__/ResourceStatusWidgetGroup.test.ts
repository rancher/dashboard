import { h } from 'vue';
import { mount } from '@vue/test-utils';
import ResourceStatusWidgetGroup from '@shell/components/ResourceStatusWidget/ResourceStatusWidgetGroup.vue';
import type { ResourceStatusWidgetConfig, ResourceStatusWidgetGroupConfig } from '@shell/components/ResourceStatusWidget/types';

// Renders its empty slot with a fallback, the same way the real widget's template does
jest.mock('@shell/components/ResourceStatusWidget/index.vue', () => {
  const { defineComponent: define, h: render, renderSlot: renderSlotWithFallback } = jest.requireActual('vue');

  return define({
    name:  'ResourceStatusWidget',
    props: { config: { type: Object, required: true } },
    setup(props: unknown, { slots }: any) {
      return () => render('div', [renderSlotWithFallback(slots, 'empty', {}, () => [render('span', 'fallback')])]);
    },
  });
});

const nodes: ResourceStatusWidgetConfig = { kind: 'summary', resource: 'node' };
const unhealthy: ResourceStatusWidgetConfig = {
  kind: 'breakdown', title: 'Unhealthy', resources: ['pod']
};

function mountGroup(config: Partial<ResourceStatusWidgetGroupConfig> = {}, slots = {}) {
  return mount(ResourceStatusWidgetGroup, {
    props: {
      config: {
        kind: 'group', widgets: [nodes, unhealthy], ...config
      }
    },
    slots,
  });
}

function widgets(wrapper: ReturnType<typeof mountGroup>) {
  return wrapper.findAllComponents({ name: 'ResourceStatusWidget' });
}

describe('component: ResourceStatusWidgetGroup', () => {
  it('should show the title', () => {
    const wrapper = mountGroup({ title: 'Status' });

    expect(wrapper.find('h4').text()).toStrictEqual('Status');
  });

  it('should not show a title when there is none', () => {
    const wrapper = mountGroup();

    expect(wrapper.find('h4').exists()).toStrictEqual(false);
  });

  it('should render a widget for each config, in order', () => {
    const wrapper = mountGroup();

    expect(widgets(wrapper).map((w) => w.props('config'))).toStrictEqual([nodes, unhealthy]);
  });

  it('should render nothing in the grid when there are no widgets', () => {
    const wrapper = mountGroup({ widgets: [] });

    expect(widgets(wrapper)).toHaveLength(0);
  });

  it('should let the widgets show their own message when there is no empty slot', () => {
    const wrapper = mountGroup();

    expect(widgets(wrapper).map((w) => w.text())).toStrictEqual(['fallback', 'fallback']);
  });

  it('should pass the config of each widget to the empty slot', () => {
    const wrapper = mountGroup({}, { empty: ({ config }: { config: ResourceStatusWidgetConfig }) => h('span', config.kind) });

    expect(widgets(wrapper).map((w) => w.text())).toStrictEqual(['summary', 'breakdown']);
  });

  it('should let a widget show its own message when the empty slot renders nothing for it', () => {
    const wrapper = mountGroup({}, { empty: ({ config }: { config: ResourceStatusWidgetConfig }) => (config.kind === 'breakdown' ? h('span', 'custom') : null) });

    expect(widgets(wrapper).map((w) => w.text())).toStrictEqual(['fallback', 'custom']);
  });
});
