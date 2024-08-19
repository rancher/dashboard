import { nextTick } from 'vue';
/* eslint-disable jest/no-hooks */
import { mount } from '@vue/test-utils';
import NodeDriverEdit from '@shell/edit/nodeDriver.vue';
import { _CREATE } from '@shell/config/query-params';

describe('view: nodedriver should', () => {
  const url = 'http://test.com';
  let wrapper: any;
  const requiredSetup = () => ({
    global: {
      mocks: {
        $store: {
          getters: {
            currentStore:              () => 'current_store',
            'current_store/schemaFor': jest.fn(),
            'current_store/all':       jest.fn(),
            'i18n/t':                  (val: string) => val,
            'i18n/exists':             jest.fn(),
          },
          dispatch: jest.fn()
        },
        $route:  { query: { AS: '' }, name: 'your_route_name' },
        $router: { applyQuery: jest.fn() },
      },

    },
    propsData: {
      value: {
        spec: {
          active:           true,
          checksum:         '',
          url:              '',
          uiUrl:            '',
          whitelistDomains: []
        }
      },
      mode: _CREATE,
    },
  });

  beforeEach(() => {
    wrapper = mount(NodeDriverEdit, { ...requiredSetup() });
  });

  afterEach(() => {
    wrapper.unmount();
  });

  it('have "Create" button disabled before fields are filled in', () => {
    const saveButton = wrapper.find('[data-testid="node-driver-edit-save"]').element as HTMLInputElement;

    expect(saveButton.disabled).toBe(true);
  });

  it('have "Create" button enabled when required fields are filled in', async() => {
    const urlField = wrapper.find('[data-testid="driver-create-url-field"]');
    const saveButton = wrapper.find('[data-testid="node-driver-edit-save"]').element as HTMLInputElement;

    urlField.setValue(url);

    await nextTick();

    expect(saveButton.disabled).toBe(false);
  });

  it.each`
    url                    | uiurl                  | checksum             | expected
    ${ '1111' }            | ${ 'http://test.com' } | ${ 'aaaaaBBBBdddd' } | ${ true }
    ${ 'http://test.com' } | ${ '1111' }            | ${ 'aaaaaBBBBdddd' } | ${ true }
    ${ 'http://test.com' } | ${ 'http://test.com' } | ${ '!!!' }           | ${ true }
    ${ 'http://test.com' } | ${ 'http://test.com' } | ${ 'aaaaaBBBBdddd' } | ${ false }
  `('have "Create" button enabled and disabled depending on validation results', async({
    url, uiurl, checksum, expected
  }) => {
    const urlField = wrapper.find('[data-testid="driver-create-url-field"]');
    const uiurlField = wrapper.find('[data-testid="driver-create-uiurl-field"]');
    const checksumField = wrapper.find('[data-testid="driver-create-checksum-field"]');
    const saveButton = wrapper.find('[data-testid="node-driver-edit-save"]').element as HTMLInputElement;

    urlField.setValue(url);
    uiurlField.setValue(uiurl);
    checksumField.setValue(checksum);

    await nextTick();

    expect(saveButton.disabled).toBe(expected);
  });
});
