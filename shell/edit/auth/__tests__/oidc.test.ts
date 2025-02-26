import { nextTick } from 'vue';
/* eslint-disable jest/no-hooks */
import { mount } from '@vue/test-utils';
import { _EDIT } from '@shell/config/query-params';

import oidc from '@shell/edit/auth/oidc.vue';

jest.mock('@shell/utils/clipboard', () => {
  return { copyTextToClipboard: jest.fn(() => Promise.resolve({})) };
});

const validClientId = 'rancheroidc';
const validClientSecret = 'TOkUxg0P67m1UXWNkJLHDPkUZFIKOWSq';
const validUrl = 'https://localhost:8080';
const validRealm = 'rancherrealm';
const validRancherUrl = 'https://localhost/verify-auth';
const validIssuer = 'http://localhost:8080/realms/rancherrealm';
const validAuthEndpoint = 'http://localhost:8080/realms/rancherrealm/protocol/openid-connect/auth';
const validScope = 'openid profile email';

const mockModel = {
  enabled:            false,
  id:                 'genericoidc',
  rancherUrl:         validRancherUrl,
  issuer:             validIssuer,
  authEndpoint:       validAuthEndpoint,
  scope:              validScope,
  clientId:           validClientId,
  clientSecret:       validClientSecret,
  type:               'genericOIDCConfig',
  groupSearchEnabled: false,
};

describe('oidc.vue', () => {
  let wrapper: any;
  const requiredSetup = () => ({
    data() {
      return {
        isEnabling:     false,
        editConfig:     false,
        model:          { ...mockModel },
        serverSetting:  null,
        errors:         [],
        originalModel:  null,
        principals:     [],
        authConfigName: 'oidc',
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
        $route:  { query: { AS: '' }, params: { id: 'oicd' } },
        $router: { applyQuery: jest.fn() },
      },
    },
    props: {
      value: { applicationSecret: '' },
      mode:  _EDIT,
    },
  });

  beforeEach(() => {
    wrapper = mount(oidc, { ...requiredSetup() });
  });
  afterEach(() => {
    wrapper.unmount();
  });

  it('have "Create" button enabled when provider is enabled and not editing config', async() => {
    wrapper.setData({ model: { enabled: true }, editConfig: false });
    await nextTick();

    const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

    expect(saveButton.disabled).toBe(false);
  });

  it('have "Create" button disabled when provider is disabled and editing config before fields are filled in', async() => {
    wrapper.setData({ model: {}, editConfig: true });
    await nextTick();

    const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

    expect(saveButton.disabled).toBe(true);
  });

  it('have "Create" button disabled when provider is disabled and editing config after required fields and scope is missing openid', async() => {
    wrapper.setData({ oidcUrls: { url: validUrl, realm: validRealm } });
    await nextTick();

    const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

    expect(saveButton.disabled).toBe(true);
  });

  it('have "Create" button enabled when customEndpoint is disabled and required fields are filled in', async() => {
    wrapper.setData({ oidcUrls: { url: validUrl, realm: validRealm }, oidcScope: validScope.split(' ') });
    await nextTick();

    const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

    expect(saveButton.disabled).toBe(false);
  });

  it('have "Create" button enabled when customEndpoint is enabled and required fields are filled in', async() => {
    wrapper.setData({ customEndpoint: { value: true }, oidcScope: validScope.split(' ') });
    await nextTick();

    const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

    expect(saveButton.disabled).toBe(false);
  });

  it('updates issuer endpoint when oidcUrls.url and oidcUrls.realm changes', async() => {
    wrapper.setData({ oidcUrls: { url: validUrl } });
    await nextTick();

    expect(wrapper.vm.model.issuer).toBe(`${ validUrl }/realms/`);

    wrapper.setData({ oidcUrls: { realm: validRealm } });
    await nextTick();

    expect(wrapper.vm.model.issuer).toBe(`${ validUrl }/realms/${ validRealm }`);
  });

  it('`groupSearchEnabled` defaults to false', async() => {
    const groupSearchCheckbox = wrapper.getComponent('[data-testid="input-group-search"]');

    expect(groupSearchCheckbox.isVisible()).toBe(true);
    expect(wrapper.vm.model.groupSearchEnabled).toBe(false);
  });

  it('`groupSearchEnabled` updates when checkbox is clicked', async() => {
    const groupSearchCheckbox = wrapper.getComponent('[data-testid="input-group-search"]');

    await groupSearchCheckbox.find('[role="checkbox"]').trigger('click');

    expect(groupSearchCheckbox.isVisible()).toBe(true);
    expect(wrapper.vm.model.groupSearchEnabled).toBe(true);
  });
});
