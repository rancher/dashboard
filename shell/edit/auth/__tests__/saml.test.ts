import { nextTick } from 'vue';
import { mount, type VueWrapper, flushPromises } from '@vue/test-utils';
import { _EDIT } from '@shell/config/query-params';
import Saml from '@shell/edit/auth/saml.vue';

const REQUIRED_FIELDS = [
  'displayNameField',
  'userNameField',
  'uidField',
  'groupsField',
  'rancherApiHost',
  'spKey',
  'spCert',
  'idpMetadataContent',
] as const;

type RequiredField = typeof REQUIRED_FIELDS[number];

const validModel = {
  enabled:            false,
  id:                 'shibboleth',
  displayNameField:   'givenName',
  userNameField:      'uid',
  uidField:           'uid',
  groupsField:        'memberOf',
  rancherApiHost:     'https://rancher.example.com',
  spKey:              '-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----',
  spCert:             '-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----',
  idpMetadataContent: '<EntityDescriptor/>',
};

const emptyRequiredFields: Record<RequiredField, string> = {
  displayNameField:   '',
  userNameField:      '',
  uidField:           '',
  groupsField:        '',
  rancherApiHost:     '',
  spKey:              '',
  spCert:             '',
  idpMetadataContent: '',
};

const mountOptions = (model: object) => ({
  data() {
    return {
      isEnabling:     false,
      editConfig:     false,
      model:          { ...model },
      serverSetting:  null,
      errors:         [],
      originalModel:  null,
      principals:     [],
      authConfigName: 'shibboleth',
    } as any;
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
          'features/get':            () => false,
        },
        dispatch: jest.fn(),
      },
      $route:  { query: { AS: '' }, params: { id: 'shibboleth' } },
      $router: { applyQuery: jest.fn() },
    },
  },
  props: {
    value: {},
    mode:  _EDIT,
  },
});

const mountOptionsForProvider = (provider: string, model: object, value: object = {}) => ({
  data() {
    return {
      isEnabling:     false,
      editConfig:     false,
      model:          { ...model, id: provider },
      serverSetting:  null,
      errors:         [],
      originalModel:  null,
      principals:     [],
      authConfigName: provider,
    } as any;
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
          'features/get':            () => false,
        },
        dispatch: jest.fn(),
      },
      $route:  { query: { AS: '' }, params: { id: provider } },
      $router: { applyQuery: jest.fn() },
    },
  },
  props: {
    value,
    mode: _EDIT,
  },
});

describe('saml.vue', () => {
  describe('validationPassed computed', () => {
    let wrapper: VueWrapper<any, any>;

    afterEach(() => {
      wrapper.unmount();
    });

    it('returns true when all required fields are filled', async() => {
      wrapper = mount(Saml, mountOptions(validModel));
      await flushPromises();

      expect(wrapper.vm.validationPassed).toBe(true);
    });

    it('returns false when all required fields are empty', async() => {
      wrapper = mount(Saml, mountOptions({ ...validModel, ...emptyRequiredFields }));
      await wrapper.vm.validateAllFields();
      await flushPromises();

      expect(wrapper.vm.validationPassed).toBe(false);
    });

    it('returns true when provider is enabled and not editing config, regardless of field state', async() => {
      wrapper = mount(Saml, mountOptions({
        ...validModel, ...emptyRequiredFields, enabled: true
      }));
      await wrapper.vm.validateAllFields();
      await flushPromises();

      expect(wrapper.vm.validationPassed).toBe(true);
    });

    it('returns false when provider is enabled but editConfig is true and required fields are empty', async() => {
      wrapper = mount(Saml, {
        ...mountOptions({
          ...validModel, ...emptyRequiredFields, enabled: true
        }),
        data() {
          return {
            isEnabling: false,
            editConfig: true,
            model:      {
              ...validModel, ...emptyRequiredFields, enabled: true
            },
            serverSetting:  null,
            errors:         [],
            originalModel:  null,
            principals:     [],
            authConfigName: 'shibboleth',
          } as any;
        },
      });
      await wrapper.vm.validateAllFields();
      await flushPromises();

      expect(wrapper.vm.validationPassed).toBe(false);
    });
  });

  describe('Enable button', () => {
    describe('is disabled', () => {
      let wrapper: VueWrapper<any, any>;

      afterEach(() => {
        wrapper.unmount();
      });

      it('when all required fields are empty', async() => {
        wrapper = mount(Saml, mountOptions({ ...validModel, ...emptyRequiredFields }));
        await wrapper.vm.validateAllFields();
        await flushPromises();

        const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

        expect(saveButton.disabled).toBe(true);
      });

      it.each([...REQUIRED_FIELDS])('when only %s is empty', async(field: RequiredField) => {
        wrapper = mount(Saml, mountOptions({ ...validModel, [field]: '' }));
        await wrapper.vm.validateAllFields();
        await flushPromises();

        const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

        expect(saveButton.disabled).toBe(true);
      });
    });

    describe('is enabled', () => {
      let wrapper: VueWrapper<any, any>;

      afterEach(() => {
        wrapper.unmount();
      });

      it('when all required fields are filled', async() => {
        wrapper = mount(Saml, mountOptions(validModel));
        await flushPromises();

        const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

        expect(saveButton.disabled).toBe(false);
      });

      it('when provider is already enabled and not editing config', async() => {
        wrapper = mount(Saml, mountOptions({
          ...validModel, ...emptyRequiredFields, enabled: true
        }));
        await nextTick();

        const saveButton = wrapper.find('[data-testid="form-save"]').element as HTMLInputElement;

        expect(saveButton.disabled).toBe(false);
      });
    });
  });

  describe('genericsaml provider', () => {
    const genericSamlModel = {
      ...validModel,
      id: 'genericsaml',
    };

    let wrapper: VueWrapper<any, any>;

    afterEach(() => {
      wrapper.unmount();
    });

    it('isGenericSaml is true for genericsaml provider', async() => {
      wrapper = mount(Saml, mountOptionsForProvider('genericsaml', genericSamlModel));
      await flushPromises();

      expect(wrapper.vm.isGenericSaml).toBe(true);
    });

    it('isGenericSaml is false for other providers', async() => {
      wrapper = mount(Saml, mountOptionsForProvider('shibboleth', validModel));
      await flushPromises();

      expect(wrapper.vm.isGenericSaml).toBe(false);
    });

    it('seeds nameIDFormat and signatureMethod defaults when unset', async() => {
      wrapper = mount(Saml, mountOptionsForProvider(
        'genericsaml',
        {
          ...genericSamlModel, nameIDFormat: undefined, signatureMethod: undefined
        },
        { configType: 'saml' }
      ));
      await flushPromises();
      wrapper.vm.applyDefaults();

      expect(wrapper.vm.model.nameIDFormat).toBe('unspecified');
      expect(wrapper.vm.model.signatureMethod).toBe('RSA-SHA256');
    });

    it('does not overwrite nameIDFormat and signatureMethod when already set', async() => {
      wrapper = mount(Saml, mountOptionsForProvider(
        'genericsaml',
        {
          ...genericSamlModel, nameIDFormat: 'persistent', signatureMethod: 'RSA-SHA512'
        },
        { configType: 'saml' }
      ));
      await flushPromises();
      wrapper.vm.applyDefaults();

      expect(wrapper.vm.model.nameIDFormat).toBe('persistent');
      expect(wrapper.vm.model.signatureMethod).toBe('RSA-SHA512');
    });

    it('does not seed generic SAML defaults for other saml providers', async() => {
      wrapper = mount(Saml, mountOptionsForProvider('shibboleth', validModel, { configType: 'saml' }));
      await flushPromises();
      wrapper.vm.applyDefaults();

      expect(wrapper.vm.model.nameIDFormat).toBeUndefined();
      expect(wrapper.vm.model.signatureMethod).toBeUndefined();
    });

    it('translates the nameIDFormat option labels', async() => {
      wrapper = mount(Saml, mountOptionsForProvider('genericsaml', genericSamlModel));
      await flushPromises();

      expect(wrapper.vm.nameIDFormatOptions).toStrictEqual([
        { value: 'unspecified', label: '%authConfig.saml.nameIDFormatOptions.unspecified%' },
        { value: 'emailAddress', label: '%authConfig.saml.nameIDFormatOptions.emailAddress%' },
        { value: 'transient', label: '%authConfig.saml.nameIDFormatOptions.transient%' },
        { value: 'persistent', label: '%authConfig.saml.nameIDFormatOptions.persistent%' },
      ]);
    });

    it('resolves nameIDFormatLabel from the model value', async() => {
      wrapper = mount(Saml, mountOptionsForProvider('genericsaml', { ...genericSamlModel, nameIDFormat: 'emailAddress' }));
      await flushPromises();

      expect(wrapper.vm.nameIDFormatLabel).toBe('%authConfig.saml.nameIDFormatOptions.emailAddress%');
    });

    it.each([
      ['keycloak', true],
      ['ping', true],
      ['genericsaml', true],
      ['shibboleth', false],
      ['okta', false],
    ] as [string, boolean][])('supportsEntityId for %s is %s', async(provider: string, expected: boolean) => {
      wrapper = mount(Saml, mountOptionsForProvider(provider, { ...validModel, id: provider }));
      await flushPromises();

      expect(wrapper.vm.supportsEntityId).toBe(expected);
    });

    it('renders generic SAML fields when provider is genericsaml', async() => {
      wrapper = mount(Saml, mountOptionsForProvider('genericsaml', genericSamlModel));
      await flushPromises();

      expect(wrapper.find('[data-testid="genericsaml-fields"]').exists()).toBe(true);
    });

    it('does not render generic SAML fields for non-generic providers', async() => {
      wrapper = mount(Saml, mountOptionsForProvider('shibboleth', validModel));
      await flushPromises();

      expect(wrapper.find('[data-testid="genericsaml-fields"]').exists()).toBe(false);
    });

    it('renders generic SAML fields in the enabled read-only view', async() => {
      wrapper = mount(Saml, mountOptionsForProvider('genericsaml', { ...genericSamlModel, enabled: true }));
      await flushPromises();

      expect(wrapper.find('[data-testid="genericsaml-view-fields"]').exists()).toBe(true);
    });

    it('does not render generic SAML view fields for non-generic providers when enabled', async() => {
      wrapper = mount(Saml, mountOptionsForProvider('shibboleth', { ...validModel, enabled: true }));
      await flushPromises();

      expect(wrapper.find('[data-testid="genericsaml-view-fields"]').exists()).toBe(false);
    });

    it('omits the nameIDFormat and signatureMethod rows when those values are unset', async() => {
      wrapper = mount(Saml, mountOptionsForProvider('genericsaml', {
        ...genericSamlModel, enabled: true, nameIDFormat: undefined, signatureMethod: undefined
      }));
      await flushPromises();

      const rows = wrapper.findAll('tr').map((row) => row.text());

      expect(rows).not.toContainEqual(expect.stringContaining('authConfig.saml.nameIDFormat'));
      expect(rows).not.toContainEqual(expect.stringContaining('authConfig.saml.signatureMethod'));
    });

    it('renders the nameIDFormat and signatureMethod rows when those values are set', async() => {
      wrapper = mount(Saml, mountOptionsForProvider('genericsaml', {
        ...genericSamlModel, enabled: true, nameIDFormat: 'emailAddress', signatureMethod: 'RSA-SHA512'
      }));
      await flushPromises();

      const rows = wrapper.findAll('tr').map((row) => row.text());

      expect(rows).toContainEqual(expect.stringContaining('%authConfig.saml.nameIDFormatOptions.emailAddress%'));
      expect(rows).toContainEqual(expect.stringContaining('RSA-SHA512'));
    });
  });
});
