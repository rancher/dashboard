import { nextTick } from 'vue';
/* eslint-disable jest/no-hooks */
import { mount } from '@vue/test-utils';
import AzureAD from '@shell/edit/auth/azuread.vue';
import { _EDIT } from '@shell/config/query-params';

jest.mock('@shell/utils/clipboard', () => {
  return { copyTextToClipboard: jest.fn(() => Promise.resolve({})) };
});

const validTenantId = '564b6f53-ebf4-43c3-8077-44c56a44990a';
const validApplicationId = '18cca356-170e-4bd9-a4a4-2e349855f96b';
const validAppSecret = 'test';
const validEndpoint = 'https://login.microsoftonline.com/';
const validAuthEndpoint = 'https://login.microsoftonline.com/564b6f53-ebf4-43c3-8077-44c56a44990a/oauth2/v2.0/authorize';
const validTokenEndpoint = 'https://login.microsoftonline.com/564b6f53-ebf4-43c3-8077-44c56a44990a/oauth2/v2.0/token';
const validGraphEndpoint = 'https://graph.microsoft.com';

const invalidEndpoint = 'aaaaBBBBaaaa';
const invalidAuthEndpoint = 'aaa';
const invalidTokenEndpoint = 'aaaaBBBBaaaa';
const invalidGraphEndpoint = 'aaaaBBBBaaaa';

const mockModel = {
  enabled:  false,
  id:       'azuread',
  endpoint: 'https://login.microsoftonline.com/',
  type:     'azureADConfig',
};

describe('edit: azureAD should', () => {
  let wrapper: any;
  const requiredSetup = () => ({
    data() {
      return {
        isEnabling:     true,
        editConfig:     false,
        model:          { ...mockModel },
        serverSetting:  null,
        errors:         [],
        originalModel:  null,
        principals:     [],
        authConfigName: 'azuread',
      };
    },
    global: {
      mocks: {
        $fetchState: { pending: false },
        $store:      {
          getters: {
            currentStore:              () => 'current_store',
            'current_store/schemaFor': jest.fn(),
            'current_store/all':       jest.fn(),
            'i18n/t':                  (val: string) => val,
            'i18n/exists':             jest.fn(),
          },
          dispatch: jest.fn()
        },
        $route:  { query: { AS: '' }, params: { id: 'azure' } },
        $router: { applyQuery: jest.fn() },
      },
    },
    propsData: {
      value: { applicationSecret: '' },
      mode:  _EDIT,
    },
  });

  beforeEach(() => {
    wrapper = mount(AzureAD, { ...requiredSetup() });
  });
  afterEach(() => {
    wrapper.unmount();
  });

  it('have "Create" button disabled before fields are filled in', () => {
    const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

    expect(saveButton.disabled).toBe(true);
  });

  it.each([
    {
      tenantId:          '',
      applicationId:     '',
      applicationSecret: '',
      result:            true
    },
    {
      tenantId:          '',
      applicationId:     validApplicationId,
      applicationSecret: validAppSecret,
      result:            true
    },
    {
      tenantId:          validTenantId,
      applicationId:     '',
      applicationSecret: validAppSecret,
      result:            true
    },
    {
      tenantId:          validTenantId,
      applicationId:     validApplicationId,
      applicationSecret: '',
      result:            true
    },
    {
      tenantId:          validTenantId,
      applicationId:     validApplicationId,
      applicationSecret: validAppSecret,
      result:            false
    },
  ])('has "Create" button enabled and disabled depending on validation results when endpoint is standard', async(testCase) => {
    const tenantIdInputField = wrapper.find('[data-testid="input-azureAD-tenantId"]');
    const applicationIdInputField = wrapper.find('[data-testid="input-azureAD-applcationId"]');
    const applicationSecretInputField = wrapper.find('[data-testid="input-azureAD-applicationSecret"]');
    const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

    tenantIdInputField.setValue(testCase.tenantId);
    applicationIdInputField.setValue(testCase.applicationId);
    applicationSecretInputField.setValue(testCase.applicationSecret);
    await nextTick();

    expect(saveButton.disabled).toBe(testCase.result);
  });

  it.each([
    {
      endpoint:      '',
      graphEndpoint: '',
      tokenEndpoint: '',
      authEndpoint:  '',
      result:        true
    },
    {
      endpoint:      invalidEndpoint,
      graphEndpoint: invalidGraphEndpoint,
      tokenEndpoint: invalidTokenEndpoint,
      authEndpoint:  invalidAuthEndpoint,
      result:        true
    },
    {
      endpoint:      '',
      graphEndpoint: validGraphEndpoint,
      tokenEndpoint: validTokenEndpoint,
      authEndpoint:  validAuthEndpoint,
      result:        true
    },
    {
      endpoint:      invalidEndpoint,
      graphEndpoint: validGraphEndpoint,
      tokenEndpoint: validTokenEndpoint,
      authEndpoint:  validAuthEndpoint,
      result:        true
    },
    {
      endpoint:      validEndpoint,
      graphEndpoint: '',
      tokenEndpoint: validTokenEndpoint,
      authEndpoint:  validAuthEndpoint,
      result:        true
    },
    {
      endpoint:      validEndpoint,
      graphEndpoint: invalidGraphEndpoint,
      tokenEndpoint: validTokenEndpoint,
      authEndpoint:  validAuthEndpoint,
      result:        true
    },
    {
      endpoint:      validEndpoint,
      graphEndpoint: validGraphEndpoint,
      tokenEndpoint: '',
      authEndpoint:  validAuthEndpoint,
      result:        true
    },
    {
      endpoint:      validEndpoint,
      graphEndpoint: validGraphEndpoint,
      tokenEndpoint: invalidTokenEndpoint,
      authEndpoint:  validAuthEndpoint,
      result:        true
    },
    {
      endpoint:      validEndpoint,
      graphEndpoint: validGraphEndpoint,
      tokenEndpoint: validTokenEndpoint,
      authEndpoint:  '',
      result:        true
    },
    {
      endpoint:      validEndpoint,
      graphEndpoint: validGraphEndpoint,
      tokenEndpoint: validTokenEndpoint,
      authEndpoint:  invalidAuthEndpoint,
      result:        true
    },
    {
      endpoint:      validEndpoint,
      graphEndpoint: validGraphEndpoint,
      tokenEndpoint: validTokenEndpoint,
      authEndpoint:  validAuthEndpoint,
      result:        false
    }
  ])('has "Create" button enabled and disabled depending on validation results when endpoint is custom', async(testCase) => {
    const tenantIdInputField = wrapper.find('[data-testid="input-azureAD-tenantId"]');
    const applicationIdInputField = wrapper.find('[data-testid="input-azureAD-applcationId"]');
    const applicationSecretInputField = wrapper.find('[data-testid="input-azureAD-applicationSecret"]');

    const endpointsRG = wrapper.find('[data-testid="endpoints-radio-input"]');
    const customButton = endpointsRG.findAll('.radio-label').at(2);
    const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

    // populate fields tested in previous test first
    tenantIdInputField.setValue(validTenantId);
    applicationIdInputField.setValue(validApplicationId);
    applicationSecretInputField.setValue(validAppSecret);
    await nextTick();

    expect(saveButton.disabled).toBe(false);
    customButton.trigger('click');
    await nextTick();
    expect(saveButton.disabled).toBe(true);

    const endpointInputField = wrapper.find('[data-testid="input-azureAD-endpoint"]');
    const graphEndpointInputField = wrapper.find('[data-testid="input-azureAD-graphEndpoint"]');
    const tokenEndpointInputField = wrapper.find('[data-testid="input-azureAD-tokenEndpoint"]');
    const authEndpointInputField = wrapper.find('[data-testid="input-azureAD-authEndpoint"]');

    endpointInputField.setValue(testCase.endpoint);
    graphEndpointInputField.setValue(testCase.graphEndpoint);
    tokenEndpointInputField.setValue(testCase.tokenEndpoint);
    authEndpointInputField.setValue(testCase.authEndpoint);
    await nextTick();

    expect(saveButton.disabled).toBe(testCase.result);
  });
});
