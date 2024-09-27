import { nextTick } from 'vue';
/* eslint-disable jest/no-hooks */
import { mount } from '@vue/test-utils';
import KontainerDriverEdit from '@shell/edit/kontainerDriver.vue';
import { _CREATE } from '@shell/config/query-params';

describe('view: kontainerdriver should', () => {
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
        $route:  { query: { AS: '' } },
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
    wrapper = mount(KontainerDriverEdit, { ...requiredSetup() });
  });

  afterEach(() => {
    wrapper.unmount();
  });

  it('have "Create" button disabled before fields are filled in', () => {
    const saveButton = wrapper.find('[data-testid="kontainer-driver-edit-save"]').element as HTMLInputElement;

    expect(saveButton.disabled).toBe(true);
  });

  it('have "Create" button enabled when required fields are filled in', async() => {
    const urlField = wrapper.find('[data-testid="driver-create-url-field"]');
    const saveButton = wrapper.find('[data-testid="kontainer-driver-edit-save"]').element as HTMLInputElement;

    urlField.setValue(url);

    await nextTick();

    expect(saveButton.disabled).toBe(false);
  });

  it('have "Create" button enabled and disabled depending on validation results', async() => {
    const urlField = wrapper.find('[data-testid="driver-create-url-field"]');
    const uiurlField = wrapper.find('[data-testid="driver-create-uiurl-field"]');
    const checksumField = wrapper.find('[data-testid="driver-create-checksum-field"]');
    const saveButton = wrapper.find('[data-testid="kontainer-driver-edit-save"]').element as HTMLInputElement;

    const testCases = [
      {
        url:      '1111',
        uiurl:    'http://test.com',
        checksum: 'aaaaaBBBBdddd',
        result:   true
      },
      {
        url:      'http://test.com',
        uiurl:    '1111',
        checksum: 'aaaaaBBBBdddd',
        result:   true
      },
      {
        url:      'http://test.com',
        uiurl:    'http://test.com',
        checksum: '!!!',
        result:   true
      },
      {
        url:      'http://test.com',
        uiurl:    'http://test.com',
        checksum: 'aaaaaBBBBdddd',
        result:   false
      }
    ];

    for (const testCase of testCases) {
      urlField.setValue(testCase.url);
      await nextTick();
      uiurlField.setValue(testCase.uiurl);
      await nextTick();
      checksumField.setValue(testCase.checksum);
      await nextTick();

      expect(saveButton.disabled).toBe(testCase.result);
    }
  });
});
