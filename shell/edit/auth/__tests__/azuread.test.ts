import { nextTick } from 'vue';
/* eslint-disable jest/no-hooks */
import { mount } from '@vue/test-utils';
import AzureAD from '@shell/edit/auth/azuread.vue';
import { _EDIT } from '@shell/config/query-params';
import { SLO_OPTION_VALUES } from '@shell/mixins/auth-config';

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

const requiredSetup = (modelOverrides = {}) => ({
  data() {
    return {
      isEnabling:     true,
      editConfig:     false,
      model:          { ...mockModel, ...modelOverrides },
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

describe('edit: azureAD accessMode default', () => {
  let wrapper: any;

  afterEach(() => {
    wrapper.unmount();
  });

  it('should default accessMode to required when not set', async() => {
    wrapper = mount(AzureAD, { ...requiredSetup({ accessMode: '' }) });
    wrapper.vm.model.tenantId = 'trigger-watcher';
    await nextTick();

    expect(wrapper.vm.model.accessMode).toStrictEqual('required');
  });

  it('should not override accessMode when already set', async() => {
    wrapper = mount(AzureAD, { ...requiredSetup({ accessMode: 'unrestricted' }) });
    wrapper.vm.model.tenantId = 'trigger-watcher';
    await nextTick();

    expect(wrapper.vm.model.accessMode).toStrictEqual('unrestricted');
  });
});

describe('edit: azureAD should', () => {
  let wrapper: any;

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

describe('edit: azureAD SSO logout should', () => {
  let wrapper: any;

  afterEach(() => {
    wrapper.unmount();
  });

  it('not render SLO section when logoutAllSupported is false', () => {
    wrapper = mount(AzureAD, { ...requiredSetup({ logoutAllSupported: false }) });
    const sloSection = wrapper.find('[data-testid="azuread-sloType"]');

    expect(sloSection.exists()).toBe(false);
  });

  it('render SLO section when logoutAllSupported is true', async() => {
    wrapper = mount(AzureAD, { ...requiredSetup({ logoutAllSupported: true }) });
    await nextTick();
    const sloSection = wrapper.find('[data-testid="azuread-sloType"]');

    expect(sloSection.exists()).toBe(true);
  });

  it('not render endSessionEndpoint field when sloType is rancher', async() => {
    wrapper = mount(AzureAD, {
      ...requiredSetup({ logoutAllSupported: true }),
      data() {
        return {
          ...requiredSetup({ logoutAllSupported: true }).data(),
          sloType: SLO_OPTION_VALUES.rancher,
        };
      },
    });
    await nextTick();
    const endSessionEndpointField = wrapper.find('[data-testid="azuread-endSessionEndpoint"]');

    expect(endSessionEndpointField.exists()).toBe(false);
  });

  it('render endSessionEndpoint field when sloType is all', async() => {
    wrapper = mount(AzureAD, {
      ...requiredSetup({ logoutAllSupported: true }),
      data() {
        return {
          ...requiredSetup({ logoutAllSupported: true }).data(),
          sloType: SLO_OPTION_VALUES.all,
        };
      },
    });
    await nextTick();
    const endSessionEndpointField = wrapper.find('[data-testid="azuread-endSessionEndpoint"]');

    expect(endSessionEndpointField.exists()).toBe(true);
  });

  it('render endSessionEndpoint field when sloType is both', async() => {
    wrapper = mount(AzureAD, {
      ...requiredSetup({ logoutAllSupported: true }),
      data() {
        return {
          ...requiredSetup({ logoutAllSupported: true }).data(),
          sloType: SLO_OPTION_VALUES.both,
        };
      },
    });
    await nextTick();
    const endSessionEndpointField = wrapper.find('[data-testid="azuread-endSessionEndpoint"]');

    expect(endSessionEndpointField.exists()).toBe(true);
  });

  it.each([
    {
      sloType: SLO_OPTION_VALUES.all, endSessionEndpoint: '', disabled: true
    },
    {
      sloType: SLO_OPTION_VALUES.all, endSessionEndpoint: 'not-a-url', disabled: true
    },
    {
      sloType: SLO_OPTION_VALUES.all, endSessionEndpoint: 'https://login.microsoftonline.com/tenant/oauth2/v2.0/logout', disabled: false
    },
    {
      sloType: SLO_OPTION_VALUES.both, endSessionEndpoint: '', disabled: true
    },
    {
      sloType: SLO_OPTION_VALUES.both, endSessionEndpoint: 'https://login.microsoftonline.com/tenant/oauth2/v2.0/logout', disabled: false
    },
  ])('has save button disabled=$disabled when sloType=$sloType and endSessionEndpoint=$endSessionEndpoint', async(testCase) => {
    wrapper = mount(AzureAD, {
      ...requiredSetup({
        logoutAllSupported: true,
        tenantId:           validTenantId,
        applicationId:      validApplicationId,
        applicationSecret:  validAppSecret,
        endSessionEndpoint: testCase.endSessionEndpoint,
      }),
      data() {
        return {
          isEnabling: true,
          editConfig: false,
          model:      {
            ...mockModel,
            logoutAllSupported: true,
            tenantId:           validTenantId,
            applicationId:      validApplicationId,
            applicationSecret:  validAppSecret,
            graphEndpoint:      validGraphEndpoint,
            tokenEndpoint:      validTokenEndpoint,
            authEndpoint:       validAuthEndpoint,
            endSessionEndpoint: testCase.endSessionEndpoint,
          },
          sloType:        testCase.sloType,
          serverSetting:  null,
          errors:         [],
          originalModel:  null,
          principals:     [],
          authConfigName: 'azuread',
        };
      },
    });
    await nextTick();
    const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

    expect(saveButton.disabled).toBe(testCase.disabled);
  });

  it('sets logoutAllEnabled=false and logoutAllForced=false when sloType changes to rancher', async() => {
    wrapper = mount(AzureAD, {
      ...requiredSetup({ logoutAllSupported: true }),
      data() {
        return {
          ...requiredSetup({ logoutAllSupported: true }).data(),
          sloType: SLO_OPTION_VALUES.all,
        };
      },
    });
    await nextTick();
    wrapper.vm.sloType = SLO_OPTION_VALUES.rancher;
    await nextTick();

    expect(wrapper.vm.model.logoutAllEnabled).toBe(false);
    expect(wrapper.vm.model.logoutAllForced).toBe(false);
    expect(wrapper.vm.model.endSessionEndpoint).toBe('');
  });

  it('sets logoutAllEnabled=true and logoutAllForced=true when sloType changes to all', async() => {
    wrapper = mount(AzureAD, {
      ...requiredSetup({ logoutAllSupported: true }),
      data() {
        return {
          ...requiredSetup({ logoutAllSupported: true }).data(),
          sloType: SLO_OPTION_VALUES.rancher,
        };
      },
    });
    await nextTick();
    wrapper.vm.sloType = SLO_OPTION_VALUES.all;
    await nextTick();

    expect(wrapper.vm.model.logoutAllEnabled).toBe(true);
    expect(wrapper.vm.model.logoutAllForced).toBe(true);
  });

  it('sets logoutAllEnabled=true and logoutAllForced=false when sloType changes to both', async() => {
    wrapper = mount(AzureAD, {
      ...requiredSetup({ logoutAllSupported: true }),
      data() {
        return {
          ...requiredSetup({ logoutAllSupported: true }).data(),
          sloType: SLO_OPTION_VALUES.rancher,
        };
      },
    });
    await nextTick();
    wrapper.vm.sloType = SLO_OPTION_VALUES.both;
    await nextTick();

    expect(wrapper.vm.model.logoutAllEnabled).toBe(true);
    expect(wrapper.vm.model.logoutAllForced).toBe(false);
  });
});
