import { shallowMount, VueWrapper } from '@vue/test-utils';
import { _CREATE } from '@shell/config/query-params';
import StorageClass from '@shell/edit/storage.k8s.io.storageclass/index.vue';

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
    isCreate:     () => true,
    isEdit:       () => false,
    isView:       () => false,
    schema:       () => ({}),
    isNamespaced: () => false,
    doneRoute:    () => 'mockedRoute',
    doneParams:   () => ({}),
  },
  methods: {
    done:               jest.fn(),
    save:               jest.fn(() => Promise.resolve()),
    registerBeforeHook: jest.fn(),
    // Echo the labelKey back so provisioner labels are deterministic for sorting assertions
    t:                  (key: string) => key,
  }
};

describe('storageClass edit', () => {
  let wrapper: VueWrapper<InstanceType<typeof StorageClass>>;

  const createComponent = (showUnsupportedStorage = true) => {
    wrapper = shallowMount(StorageClass,
      {
        props:  { value: { parameters: {} } },
        mixins: [createEditViewMock],
        global: {
          mocks: {
            $store: {
              getters: {
                'cluster/schemaFor': jest.fn(() => false),
                'features/get':      jest.fn(() => showUnsupportedStorage),
                'i18n/t':            jest.fn((key: string) => key),
                'i18n/withFallback': jest.fn((key: string, args: any, fallback: string) => fallback),
              }
            }
          },
        },
      }
    );
  };

  it('lists non-deprecated provisioners before deprecated ones', () => {
    createComponent();

    const options = wrapper.vm.provisioners;
    const firstDeprecatedIndex = options.findIndex((o: any) => o.deprecated);
    const lastNonDeprecatedIndex = options.map((o: any) => !!o.deprecated).lastIndexOf(false);

    // Every deprecated option should come after every non-deprecated option
    expect(firstDeprecatedIndex).toBeGreaterThan(lastNonDeprecatedIndex);
  });

  it('sorts provisioners alphabetically within the deprecated and non-deprecated groups', () => {
    createComponent();

    const options = wrapper.vm.provisioners;
    const nonDeprecated = options.filter((o: any) => !o.deprecated).map((o: any) => o.label.toLowerCase());
    const deprecated = options.filter((o: any) => o.deprecated).map((o: any) => o.label.toLowerCase());

    expect(nonDeprecated).toStrictEqual([...nonDeprecated].sort());
    expect(deprecated).toStrictEqual([...deprecated].sort());
  });
});
