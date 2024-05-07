import { shallowMount, Wrapper } from '@vue/test-utils';
import { _CLONE } from '@shell/config/query-params';
import ServicePage from '@shell/edit/service.vue';

const createEditViewMock = {
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
    done:         jest.fn(),
    conflict:     jest.fn(() => Promise.resolve([])),
    save:         jest.fn(() => Promise.resolve()),
    actuallySave: jest.fn(() => Promise.resolve()),
    setErrors:    jest.fn()
  }
};

const formValidationMock = {};

describe('service edit', () => {
  let wrapper: Wrapper<InstanceType<typeof ServicePage>>;

  const createComponent = (propsData: any) => {
    wrapper = shallowMount(ServicePage,
      {
        propsData,
        mixins: [createEditViewMock, formValidationMock],
        mocks:  {
          $store: {
            getters: {
              'management/all': jest.fn(),
              'i18n/t':         jest.fn()
            }
          }
        },
        computed: { provisioningCluster: jest.fn() },
      }
    );
  };

  it('sets clusterIP to an empty string and deletes clusterIPs when in clone mode', () => {
    const value = {
      spec: {
        clusterIP:  '10.43.1.1',
        clusterIPs: ['10.43.1.1', '10.43.1.2'],
      }
    };

    createComponent({ realMode: _CLONE, value });

    expect(wrapper.vm.value.spec.clusterIP).toBe('');
    expect(wrapper.vm.value.spec.clusterIPs).toBeUndefined();
  });

  it('does not change clusterIP and clusterIPs when not in clone mode', () => {
    const value = {
      spec: {
        clusterIP:  '10.43.1.1',
        clusterIPs: ['10.43.1.1', '10.43.1.2'],
      }
    };

    createComponent({ realMode: 'someOtherMode', value });

    expect(wrapper.vm.value.spec.clusterIP).toBe('10.43.1.1');
    expect(wrapper.vm.value.spec.clusterIPs).toStrictEqual(['10.43.1.1', '10.43.1.2']);
  });
});
