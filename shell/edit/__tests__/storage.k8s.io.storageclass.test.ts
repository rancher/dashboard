import { shallowMount, VueWrapper } from '@vue/test-utils';
import { _CREATE } from '@shell/config/query-params';
import StorageClass from '@shell/edit/storage.k8s.io.storageclass/index.vue';
import AwsEbsProvisioner from '@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/aws-ebs.vue';
import LonghornProvisioner from '@shell/edit/storage.k8s.io.storageclass/provisioners/driver.longhorn.io.vue';
import CustomProvisioner from '@shell/edit/storage.k8s.io.storageclass/provisioners/custom.vue';
import { PROVISIONER_OPTIONS } from '@shell/models/storage.k8s.io.storageclass';

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

  it.each([
    ['kubernetes.io/aws-ebs', AwsEbsProvisioner],
    ['driver.longhorn.io', LonghornProvisioner],
    ['example.com/unknown', CustomProvisioner],
  ])('shows the provisioner form for %p', (provisioner, expected) => {
    createComponent();

    expect(wrapper.vm.getComponent(provisioner)).toStrictEqual(expected);
  });

  it.each(PROVISIONER_OPTIONS.map((opt) => opt.value))('has a provisioner form of its own for %p', (provisioner) => {
    createComponent();

    const component = wrapper.vm.getComponent(provisioner);

    expect(component).toBeDefined();
    expect(component).not.toStrictEqual(CustomProvisioner);
  });
});
