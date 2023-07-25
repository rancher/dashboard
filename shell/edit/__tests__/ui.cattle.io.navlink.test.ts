/* eslint-disable jest/no-hooks */
import { mount } from '@vue/test-utils';
import Navlink from '@shell/edit/ui.cattle.io.navlink.vue';
import { _CREATE } from '@shell/config/query-params';
import CruResource from '@shell/components/CruResource';

describe('view: ui.cattle.io.navlink should', () => {
  const name = 'test';
  const url = 'http://test.com';
  let wrapper: any;

  const requiredSetup = () => ({
    // Remove all these mocks after migration to Vue 2.7/3 due mixin logic
    mocks: {
      $store: {
        getters: {
          currentStore:              () => 'current_store',
          'current_store/schemaFor': jest.fn(),
          'current_store/all':       jest.fn(),
          'i18n/t':                  (val) => val,
          'i18n/exists':             jest.fn(),
        }
      },
      $route:  { query: { AS: '' } },
      $router: { applyQuery: jest.fn() },
    },
    propsData: {
      metadata:   { namespace: 'test' },
      spec:       { template: {} },
      targetInfo: { mode: 'all' },
      value:      {},
      mode:       _CREATE,
    },

  });

  beforeEach(() => {
    wrapper = mount(Navlink, { ...requiredSetup() });
  });

  afterEach(() => {
    wrapper.destroy();
  });

  it('have "Create" button disabled before fields are filled in', () => {
    const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

    expect(saveButton.disabled).toBe(true);
  });
  it('have "Create" button disabled when Link type is URL and only name is filled in', async() => {
    const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;
    const nameField = wrapper.find('[data-testid="Navlink-name-field"]').find('input');

    nameField.setValue(name);

    await wrapper.vm.$nextTick();

    expect(saveButton.disabled).toBe(true);
  });
  it('have "Create" button enabled when Link type is URL and all required fields are filled in', async() => {
    const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;
    const nameField = wrapper.find('[data-testid="Navlink-name-field"]').find('input');
    const urlField = wrapper.find('[data-testid="Navlink-url-field"]');

    nameField.setValue(name);
    urlField.setValue(url);

    await wrapper.vm.$nextTick();

    expect(saveButton.disabled).toBe(false);
  });

  it('have "Create" button disabled when Link type is Service and and only name is filled in', async() => {
    const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;
    const nameField = wrapper.find('[data-testid="Navlink-name-field"]').find('input');
    const rg = wrapper.find('[data-testid="Navlink-link-radiogroup"]');

    const serviceBttn = rg.findAll('.radio-label').at(1);

    nameField.setValue(name);
    serviceBttn.trigger('click');
    await wrapper.vm.$nextTick();

    expect(saveButton.disabled).toBe(true);
  });

  it('have "Create" button enabled when Link type is Service and and all required fields are filled in', async() => {
    const nameField = wrapper.find('[data-testid="Navlink-name-field"]').find('input');
    const rg = wrapper.find('[data-testid="Navlink-link-radiogroup"]');

    const serviceBttn = rg.findAll('.radio-label').at(1);

    nameField.setValue(name);
    serviceBttn.trigger('click');
    await wrapper.vm.$nextTick();

    const schemeField = wrapper.find('[data-testid="Navlink-scheme-field"]');
    const serviceField = wrapper.find('[data-testid="Navlink-currentService-field"]');

    schemeField.find('button').trigger('click');
    await wrapper.trigger('keydown.down');
    await wrapper.trigger('keydown.enter');

    serviceField.find('button').trigger('click');
    await wrapper.trigger('keydown.down');
    await wrapper.trigger('keydown.enter');

    expect(CruResource.computed.canSave()).toBe(true);
  });
});
