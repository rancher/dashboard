import { mount } from '@vue/test-utils';
import ChartInfoDrawer from '@shell/pages/c/_cluster/apps/charts/ChartInfoDrawer.vue';
import ChartReadme from '@shell/components/ChartReadme.vue';

const versionInfo = { readme: 'README' };

const createWrapper = () => mount(ChartInfoDrawer, {
  props:  { versionInfo },
  global: {
    provide: { store: {} },
    stubs:   { ChartReadme: true },
  },
});

describe('component: ChartInfoDrawer', () => {
  it('should render the chart readme in the standard drawer', () => {
    const wrapper = createWrapper();

    expect(wrapper.attributes('role')).toBe('dialog');
    expect(wrapper.attributes('aria-label')).toBe('catalog.install.steps.helmValues.chartInfo.label');
    expect(wrapper.find('.header .title').text()).toBe('catalog.install.steps.helmValues.chartInfo.label');
    expect(wrapper.findComponent(ChartReadme).props('versionInfo')).toStrictEqual(versionInfo);
  });

  it('should emit close when the drawer is closed', async() => {
    const wrapper = createWrapper();

    await wrapper.find('[data-testid="rc-drawer-close"]').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
    expect(wrapper.emitted('dock')).toBeUndefined();
  });

  it('should ask to be docked and then close when dock is clicked', async() => {
    const wrapper = createWrapper();

    await wrapper.find('[data-testid="chart-info-dock"]').trigger('click');

    expect(wrapper.emitted('dock')).toHaveLength(1);
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
