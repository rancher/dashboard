import { shallowMount, VueWrapper } from '@vue/test-utils';
import { _CLONE, _CREATE } from '@shell/config/query-params';
import ServicePage from '@shell/edit/service.vue';

const createEditViewMock = {
  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    realMode: {
      type:    String,
      default: _CREATE
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

const formValidationMock = {};

describe('service edit', () => {
  let wrapper: VueWrapper<InstanceType<typeof ServicePage>>;

  const createComponent = (propsData: any) => {
    wrapper = shallowMount(ServicePage,
      {
        props:    propsData,
        mixins:   [createEditViewMock, formValidationMock],
        computed: { provisioningCluster: jest.fn() },
        global:   {
          mocks: {
            $store: {
              getters: {
                'management/all': jest.fn(),
                'i18n/t':         jest.fn()
              }
            }
          },
        },
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
