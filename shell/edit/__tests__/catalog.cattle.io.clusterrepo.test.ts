import { flushPromises, mount, shallowMount, VueWrapper } from '@vue/test-utils';
import { createStore } from 'vuex';
import CruCatalogRepo from '@shell/edit/catalog.cattle.io.clusterrepo.vue';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { AUTH_TYPE, CLUSTER_REPO_TYPES } from '@shell/config/types';
import { getVersionData } from '@shell/config/version';

const createEditViewMock = {
  props: {
    value: {
      type:    Object,
      default: () => ({}),
    },
    realMode: {
      type:    String,
      default: _CREATE,
    },
  },
  data() {
    return { errors: [] };
  },
  computed: {
    isCreate:     () => false,
    isEdit:       () => true,
    isView:       () => false,
    schema:       () => ({}),
    isNamespaced: () => false,
    labels:       {
      get: jest.fn(() => ({})),
      set: jest.fn(),
    },
    annotations: {
      get: jest.fn(() => ({})),
      set: jest.fn(),
    },
    doneRoute:  () => 'mockedRoute',
    doneParams: () => ({}),
  },
  methods: {
    done:               jest.fn(),
    conflict:           jest.fn(() => Promise.resolve([])),
    save:               jest.fn(() => Promise.resolve()),
    actuallySave:       jest.fn(() => Promise.resolve()),
    setErrors:          jest.fn(),
    registerBeforeHook: jest.fn(),
  }
};

jest.mock('@shell/config/version', () => ({ getVersionData: jest.fn(() => ({ RancherPrime: 'false' })) }));
jest.mock('@shell/utils/require-asset', () => ({ requireAsset: (path: string) => path }));

const defaultGlobalMocks = {
  $store: {
    getters: {
      'i18n/t':       (key: string) => key,
      currentProduct: { inStore: 'cluster' },
      'cluster/byId': () => null,
      'cluster/all':  () => [],
    },
    dispatch: jest.fn(),
  },
  $route: {
    name:  'test-route',
    query: {},
  },
  $fetchState: { pending: false },
};

const createWrapper = (specOverrides = {}, mode = _EDIT): VueWrapper<any> => {
  return shallowMount(CruCatalogRepo, {
    props: {
      value: {
        spec:                      { url: 'https://test.com', ...specOverrides },
        isOciType:                 false,
        isSuseAppCollectionFromUI: false,
        metadata:                  { name: 'test-repo', annotations: {} },
      },
      realMode: mode,
    },
    mixins: [createEditViewMock],
    global: {
      mocks: defaultGlobalMocks,
      stubs: {
        AsyncButton:              true,
        Footer:                   true,
        NameNsDescription:        true,
        Labels:                   true,
        SelectOrCreateAuthSecret: true,
        Banner:                   true,
        RcItemCard:               true,
        UnitInput:                true,
      },
    },
  });
};

describe('CruCatalogRepo - refresh interval', () => {
  describe('initial state', () => {
    it('defaults to enabled with null display value when no refreshInterval is set', () => {
      const wrapper = createWrapper();

      expect(wrapper.vm.refreshEnabled).toStrictEqual(true);
      expect(wrapper.vm.refreshDisplayValue).toStrictEqual(null);
      expect(wrapper.vm.refreshUnit).toStrictEqual(3600);
    });

    it('parses existing refreshInterval into display value and unit', () => {
      const wrapper = createWrapper({ refreshInterval: 7200 });

      expect(wrapper.vm.refreshEnabled).toStrictEqual(true);
      expect(wrapper.vm.refreshDisplayValue).toStrictEqual(2);
      expect(wrapper.vm.refreshUnit).toStrictEqual(3600);
    });

    it('parses refreshInterval that maps to minutes', () => {
      const wrapper = createWrapper({ refreshInterval: 300 });

      expect(wrapper.vm.refreshEnabled).toStrictEqual(true);
      expect(wrapper.vm.refreshDisplayValue).toStrictEqual(5);
      expect(wrapper.vm.refreshUnit).toStrictEqual(60);
    });

    it('parses refreshInterval that maps to days', () => {
      const wrapper = createWrapper({ refreshInterval: 172800 });

      expect(wrapper.vm.refreshEnabled).toStrictEqual(true);
      expect(wrapper.vm.refreshDisplayValue).toStrictEqual(2);
      expect(wrapper.vm.refreshUnit).toStrictEqual(86400);
    });

    it('parses refreshInterval that maps to seconds', () => {
      const wrapper = createWrapper({ refreshInterval: 45 });

      expect(wrapper.vm.refreshEnabled).toStrictEqual(true);
      expect(wrapper.vm.refreshDisplayValue).toStrictEqual(45);
      expect(wrapper.vm.refreshUnit).toStrictEqual(1);
    });

    it('sets refreshEnabled to false when refreshInterval is -1', () => {
      const wrapper = createWrapper({ refreshInterval: -1 });

      expect(wrapper.vm.refreshEnabled).toStrictEqual(false);
      expect(wrapper.vm.refreshDisplayValue).toStrictEqual(null);
    });
  });

  describe('syncRefreshIntervalToSpec', () => {
    it('sets spec.refreshInterval to -1 when disabled', () => {
      const wrapper = createWrapper();

      wrapper.vm.onRefreshEnabledChange(false);

      expect(wrapper.vm.value.spec.refreshInterval).toStrictEqual(-1);
    });

    it('deletes spec.refreshInterval when input is empty', () => {
      const wrapper = createWrapper({ refreshInterval: 3600 });

      wrapper.vm.onRefreshValueChange('');

      expect(wrapper.vm.value.spec.refreshInterval).toStrictEqual(undefined);
    });

    it('deletes spec.refreshInterval when input is 0', () => {
      const wrapper = createWrapper({ refreshInterval: 3600 });

      wrapper.vm.onRefreshValueChange('0');

      expect(wrapper.vm.value.spec.refreshInterval).toStrictEqual(undefined);
    });

    it('converts display value and unit to seconds on spec', () => {
      const wrapper = createWrapper();

      wrapper.vm.onRefreshValueChange('5');

      expect(wrapper.vm.value.spec.refreshInterval).toStrictEqual(5 * 3600);
    });

    it('recalculates when unit changes', () => {
      const wrapper = createWrapper();

      wrapper.vm.onRefreshValueChange('2');
      wrapper.vm.onRefreshUnitChange(60);

      expect(wrapper.vm.value.spec.refreshInterval).toStrictEqual(120);
    });

    it('recalculates when re-enabled', () => {
      const wrapper = createWrapper();

      wrapper.vm.onRefreshValueChange('10');
      wrapper.vm.onRefreshEnabledChange(false);

      expect(wrapper.vm.value.spec.refreshInterval).toStrictEqual(-1);

      wrapper.vm.onRefreshEnabledChange(true);

      expect(wrapper.vm.value.spec.refreshInterval).toStrictEqual(10 * 3600);
    });
  });

  describe('onRefreshValueChange', () => {
    it('normalizes empty string to null', () => {
      const wrapper = createWrapper();

      wrapper.vm.onRefreshValueChange('');

      expect(wrapper.vm.refreshDisplayValue).toStrictEqual(null);
    });

    it('normalizes null to null', () => {
      const wrapper = createWrapper();

      wrapper.vm.onRefreshValueChange(null);

      expect(wrapper.vm.refreshDisplayValue).toStrictEqual(null);
    });

    it('coerces string value to number', () => {
      const wrapper = createWrapper();

      wrapper.vm.onRefreshValueChange('42');

      expect(wrapper.vm.refreshDisplayValue).toStrictEqual(42);
    });
  });

  describe('validation', () => {
    it('returns error for negative values', () => {
      const wrapper = createWrapper();
      const rule = wrapper.vm.refreshIntervalRules[0];

      expect(rule(-1)).toBeDefined();
    });

    it('returns undefined for zero', () => {
      const wrapper = createWrapper();
      const rule = wrapper.vm.refreshIntervalRules[0];

      expect(rule(0)).toStrictEqual(undefined);
    });

    it('returns undefined for positive values', () => {
      const wrapper = createWrapper();
      const rule = wrapper.vm.refreshIntervalRules[0];

      expect(rule(5)).toStrictEqual(undefined);
    });
  });
});

describe('CruCatalogRepo - target cards', () => {
  const imageAlts = (wrapper: VueWrapper<any>) => wrapper.vm.clusterRepoTargets
    .filter((card: any) => card.image.src)
    .map((card: any) => card.image.alt);

  it('gives the OCI card image an empty alt, since the card title already names it', () => {
    const wrapper = createWrapper({}, _CREATE);

    expect(imageAlts(wrapper)).toStrictEqual([{ text: '' }]);
  });

  it('gives the SUSE App Collection card image an empty alt on Rancher Prime', () => {
    (getVersionData as jest.Mock).mockReturnValueOnce({ RancherPrime: 'true' });
    const wrapper = createWrapper({}, _CREATE);

    expect(imageAlts(wrapper)).toStrictEqual([{ text: '' }, { text: '' }]);
  });
});

describe('CruCatalogRepo - form validation', () => {
  const createValidationWrapper = (spec = {}, mode = _CREATE): VueWrapper<any> => {
    const store = createStore({ getters: { 'i18n/t': () => (key: string) => key } });

    return mount(CruCatalogRepo, {
      props: {
        value: {
          spec,
          isOciType:                 false,
          isSuseAppCollectionFromUI: false,
          metadata:                  { name: 'test-repo', annotations: {} },
        },
        mode,
        realMode: mode,
      },
      mixins: [createEditViewMock],
      global: {
        plugins: [store],
        mocks:   defaultGlobalMocks,
        stubs:   {
          AsyncButton:       true,
          NameNsDescription: true,
          Labels:            true,
          LabeledSelect:     true,
          Banner:            true,
          RcItemCard:        true,
          UnitInput:         true,
          Checkbox:          true,
        },
      },
    });
  };

  const addRepositoryDisabled = (wrapper: VueWrapper<any>) => wrapper.findComponent({ name: 'AsyncButton' }).attributes('disabled');

  it.each([
    ['disables', '', 'true'],
    ['enables', 'https://charts.example.com', 'false'],
  ])('%s Add Repository when the Helm index URL is %p', async(_, url, disabled) => {
    const wrapper = createValidationWrapper({ url });

    await flushPromises();

    expect(addRepositoryDisabled(wrapper)).toStrictEqual(disabled);
  });

  it.each([
    ['disables', '', 'true'],
    ['enables', 'https://github.com/rancher/charts', 'false'],
  ])('%s Add Repository when the Git repo URL is %p', async(_, gitRepo, disabled) => {
    const wrapper = createValidationWrapper();

    wrapper.vm.onTargetChange(CLUSTER_REPO_TYPES.GIT_REPO);
    wrapper.vm.value.spec.gitRepo = gitRepo;
    await flushPromises();

    expect(addRepositoryDisabled(wrapper)).toStrictEqual(disabled);
  });

  it('disables Add Repository when the OCI URL is empty', async() => {
    const wrapper = createValidationWrapper();

    wrapper.vm.onTargetChange(CLUSTER_REPO_TYPES.OCI_URL);
    await flushPromises();

    expect(addRepositoryDisabled(wrapper)).toStrictEqual('true');
  });

  it('disables Save when editing a repository whose URL has been cleared', async() => {
    const wrapper = createValidationWrapper({ url: 'https://charts.example.com' }, _EDIT);

    wrapper.vm.value.spec.url = '';
    await flushPromises();

    expect(wrapper.findComponent({ name: 'Footer' }).props('disableSave')).toStrictEqual(true);
  });

  it.each([
    ['disables', AUTH_TYPE._BASIC, '', '', 'true'],
    ['enables', AUTH_TYPE._BASIC, 'user', 'pass', 'false'],
    ['disables', AUTH_TYPE._SSH, '', '', 'true'],
    ['enables', AUTH_TYPE._SSH, 'public', 'private', 'false'],
  ])('%s Add Repository when creating a %p secret with public %p and private %p', async(_, selected, publicKey, privateKey, disabled) => {
    const wrapper = createValidationWrapper({ url: 'https://charts.example.com' });

    await wrapper.findComponent({ name: 'SelectOrCreateAuthSecret' }).setData({
      selected, publicKey, privateKey
    });
    await flushPromises();

    expect(addRepositoryDisabled(wrapper)).toStrictEqual(disabled);
  });
});
