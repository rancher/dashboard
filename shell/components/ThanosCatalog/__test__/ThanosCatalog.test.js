import ThanosCatalog from '@shell/components/ThanosCatalog/index.vue';
import { mount } from '@vue/test-utils';
import { _EDIT } from '@shell/config/query-params';

const $route = { params: { cluster: 'local' }, hash: '' };
const $router = {
  currentRoute: '', replace: r => r, push: jest.fn()
};

describe('global monitorning ThanosCatalog', () => {
  it('should display default inputs', () => {
    const wrapper = mount(ThanosCatalog, {
      propsData: {
        tabErrors:               {},
        fvGetAndReportPathRules: () => {},
        installed:               false,
        monitoringSettings:      {},
        value:                   { global: { cattle: { clusterId: 'local' } }, ui: { defaultApiToken: true } },
        mode:                    _EDIT,
      },
      mocks: { $route, $router }
    });

    const inputWraps = wrapper.findAll('[data-testid^=input-config-]');

    expect(inputWraps).toHaveLength(3);
  });

  it('should change an update on selection', async() => {
    const wrapper = mount(ThanosCatalog, {
      propsData: {
        tabErrors:               {},
        fvGetAndReportPathRules: () => {},
        installed:               false,
        monitoringSettings:      {},
        value:                   { global: { clusterId: 'local' }, ui: { defaultApiToken: false } },
        mode:                    _EDIT,
      },
      mocks: { $route, $router },
    });

    const select = wrapper.find(`[data-testid="input-config-version"]`);
    const select2 = wrapper.find(`[data-testid="input-config-clusterId"]`);

    select.find('button').trigger('click');
    select2.find('button').trigger('click');
    await wrapper.trigger('keydown.down');
    await wrapper.trigger('keydown.enter');

    expect(wrapper.emitted('updateVersion')).toHaveLength(1);
    expect($router.push).toBeCalledTimes(1);
  });
});
