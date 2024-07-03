
/* eslint-disable jest/no-mocks-import */
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { shallowMount } from '@vue/test-utils';
import Networking from '../Networking.vue';

const mockedValidationMixin = {
  computed: {
    fvFormIsValid:                jest.fn(),
    type:                         jest.fn(),
    fvUnreportedValidationErrors: jest.fn(),
  },
  methods: { fvGetAndReportPathRules: jest.fn() }
};

const mockedStore = () => {
  return {
    getters: {
      'i18n/t': (text: string) => text,
      t:        (text: string) => text,
    },
  };
};

const mockedRoute = { query: {} };

const requiredSetup = () => {
  return {
    mixins: [mockedValidationMixin],
    mocks:  {
      $store:      mockedStore(),
      $route:      mockedRoute,
      $fetchState: {},
    }
  };
};

describe('eKS Networking', () => {
  it('should allow the user to add endpoints when public access is checked', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Networking, {
      propsData: {},
      ...setup
    });

    const publicAccessSources = wrapper.find('[data-testid="eks-public-access-sources"]');

    expect(publicAccessSources.vm.addAllowed).toBe(false);

    wrapper.setProps({ publicAccess: true });
    await wrapper.vm.$nextTick();
    expect(publicAccessSources.vm.addAllowed).toBe(true);
  });

  it('should show a vpc and subnet selector when the select from existing subnets radio option is selected', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Networking, {
      propsData: { mode: _CREATE },
      ...setup
    });

    wrapper.setData({ chooseSubnet: true });
    await wrapper.vm.$nextTick();
    const subnetDropdown = wrapper.find('[data-testid="eks-subnets-dropdown"]');

    expect(subnetDropdown.exists()).toBe(true);

    wrapper.setData({ chooseSubnet: false });
    await wrapper.vm.$nextTick();
    expect(subnetDropdown.exists()).toBe(false);
  });

  it('should show a list of subnets in use if a cluster has already provisioned and the \'create automatically\' vpc option was selected', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Networking, {
      propsData: {
        mode: _EDIT, subnets: [], statusSubnets: ['bc', 'def']
      },
      ...setup
    });

    await wrapper.vm.$nextTick();

    const subnetDropdown = wrapper.find('[data-testid="eks-subnets-dropdown"]');

    expect(subnetDropdown.exists()).toBe(true);

    expect(subnetDropdown.props().value).toStrictEqual(['bc', 'def']);
  });
});
