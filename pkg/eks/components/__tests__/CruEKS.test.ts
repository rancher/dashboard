import flushPromises from 'flush-promises';
import { mount, shallowMount, Wrapper } from '@vue/test-utils';
import { EKSConfig, EKSNodeGroup } from 'types';
import CruEKS from '@pkg/eks/components/CruEKS.vue';

const mockedValidationMixin = {
  computed: {
    fvFormIsValid:                jest.fn(),
    type:                         jest.fn(),
    fvUnreportedValidationErrors: jest.fn(),
  },
  methods: { fvGetAndReportPathRules: jest.fn() }
};

const mockedStore = (versionSetting: any) => {
  return {
    getters: {
      'i18n/t':                  (text: string) => text,
      t:                         (text: string) => text,
      currentStore:              () => 'current_store',
      'current_store/schemaFor': jest.fn(),
      'current_store/all':       jest.fn(),
      'management/byId':         () => {
        return versionSetting;
      },
      'management/schemaFor': jest.fn(),
      'rancher/create':       () => {}
    },
    dispatch: jest.fn()
  };
};

const mockedRoute = { query: {} };

const requiredSetup = (versionSetting = { value: '<=1.27.x' }) => {
  return {
    mixins: [mockedValidationMixin],
    mocks:  {
      $store:      mockedStore(versionSetting),
      $route:      mockedRoute,
      $fetchState: {},
    }
  };
};

const setCredential = async(wrapper :Wrapper<any>, config = {} as EKSConfig) => {
  config.amazonCredentialSecret = 'foo';
  wrapper.setData({ config });
  await flushPromises();
};

describe('eKS provisioning form', () => {
  it('should hide the form if no credential is selected', () => {
    const wrapper = shallowMount(CruEKS, { propsData: { value: {}, mode: 'create' }, ...requiredSetup() });

    const form = wrapper.find('[data-testid="crueks-form"]');

    expect(form.exists()).toBe(false);
  });

  it('should show the form when a credential is selected', async() => {
    const wrapper = shallowMount(CruEKS, {
      propsData: { value: {}, mode: 'create' },
      ...requiredSetup()
    });

    const formSelector = '[data-testid="crueks-form"]';

    expect(wrapper.find(formSelector).exists()).toBe(false);

    await setCredential(wrapper);
    expect(wrapper.find(formSelector).exists()).toBe(true);
  });

  it('should not use form validation if no credential is selected', async() => {
    const wrapper = shallowMount(CruEKS, {
      propsData: { value: {}, mode: 'create' },
      ...requiredSetup()
    });

    let fvRules = wrapper.vm.fvExtraRules;

    expect(fvRules).toStrictEqual({});

    await setCredential(wrapper);
    await wrapper.vm.$nextTick();

    fvRules = wrapper.vm.fvExtraRules;

    expect(Object.keys(fvRules).length).toBeGreaterThan(0);
  });

  it('should update both cluster.name and config.displayName when the name input is altered', async() => {
    const wrapper = shallowMount(CruEKS, {
      propsData: { value: {}, mode: 'create' },
      ...requiredSetup()
    });

    const formSelector = '[data-testid="crueks-form"]';

    expect(wrapper.find(formSelector).exists()).toBe(false);

    await setCredential(wrapper);

    const nameInput = wrapper.find('[data-testid="eks-name-input"]');

    nameInput.vm.$emit('input', 'abc');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.config.displayName).toStrictEqual('abc');
    expect(wrapper.vm.normanCluster.name).toStrictEqual('abc');
    expect(nameInput.props().value).toStrictEqual('abc');

    nameInput.vm.$emit('input', 'def');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.config.displayName).toStrictEqual('def');
    expect(wrapper.vm.normanCluster.name).toStrictEqual('def');
    expect(nameInput.props().value).toStrictEqual('def');
  });

  it('should set _isNew to true when a pool is added', async() => {
    const wrapper = shallowMount(CruEKS, {
      propsData: { value: {}, mode: 'edit' },
      ...requiredSetup()
    });

    wrapper.setData({ nodeGroups: [{ name: 'abc' }] });
    wrapper.vm.addGroup();
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.nodeGroups).toHaveLength(2);
    expect(wrapper.vm.nodeGroups.filter((group: EKSNodeGroup) => !group._isNew)).toHaveLength(1);
  });

  it('should update new node pool\s version when cluster version is updated', async() => {
    const wrapper = shallowMount(CruEKS, {
      propsData: { value: {}, mode: 'edit' },
      ...requiredSetup()
    });

    wrapper.setData({ nodeGroups: [{ name: 'abc' }] });
    wrapper.vm.addGroup();
    await wrapper.vm.$nextTick();

    wrapper.setData({ config: { kubernetesVersion: '1.24' } });

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.nodeGroups.filter((group: EKSNodeGroup) => group.version === '1.24')).toHaveLength(1);
  });
});
