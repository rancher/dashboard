import { shallowMount } from '@vue/test-utils';

import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import Taints from '@shell/components/form/Taints.vue';
import GKENodePool from '../GKENodePool.vue';
import { _EDIT } from '@shell/config/query-params';

// const mockedValidationMixin = {
//   computed: {
//     fvFormIsValid:                jest.fn(),
//     type:                         jest.fn(),
//     fvUnreportedValidationErrors: jest.fn(),
//   },
//   methods: { fvGetAndReportPathRules: jest.fn() }
// };

const mockedStore = () => {
  return {
    getters: {
      'i18n/withFallback': (text: string, opts: {[key:string]: string}) => `${ text }${ Object.values(opts || {}) }`,
      t:                   (text: string) => text,
      currentStore:        () => 'current_store',
    },
    dispatch: jest.fn()
  };
};
const mockedRoute = { query: {} };

const requiredSetup = () => {
  return {
    // mixins: [mockedValidationMixin],
    global: {
      mocks: {
        $store:      mockedStore(),
        $route:      mockedRoute,
        $fetchState: {},
      }
    }
  };
};

jest.mock('@shell/components/google/util/gcp');

describe('gke node pool', () => {
  it('should offer a dropdown of service account options defaulting to null opt', async() => {
    const setup = requiredSetup();

    const serviceAccountOptions = [{ label: 'default', value: null }, { label: 'abc', value: 'abc@abc.com' }, { label: 'abc1', value: 'abc1@abc.com' }];
    const wrapper = shallowMount(GKENodePool, {
      props: {
        serviceAccountOptions,
        // `serviceAccount` is declared `type: String` but defaults to `null`, and null is the value that
        // selects the default service account - so the declared type is narrower than reality.
        serviceAccount: null as unknown as string,
      },
      ...setup
    });

    const serviceAccountSelect = wrapper.getComponent<typeof LabeledSelect>('[data-testid="gke-service-account-select"]');

    expect(serviceAccountSelect.props().value).toStrictEqual(serviceAccountOptions[0]);

    wrapper.setProps({ serviceAccount: 'abc@abc.com' });

    await wrapper.vm.$nextTick();

    expect(serviceAccountSelect.props().value).toStrictEqual(serviceAccountOptions[1]);

    wrapper.setProps({ serviceAccount: null as unknown as string });

    await wrapper.vm.$nextTick();

    expect(serviceAccountSelect.props().value).toStrictEqual(serviceAccountOptions[0]);
  });

  it('should show a disabled input with k8s version matching cluster k8s version on create', async() => {
    const setup = requiredSetup();
    const wrapper = shallowMount(GKENodePool, {
      props: {
        clusterKubernetesVersion: '1.23.4',
        version:                  '1.23.4'
      },
      ...setup
    });

    const versionDisplay = wrapper.findComponent<typeof LabeledInput>('[data-testid="gke-k8s-display"]');

    expect(versionDisplay.exists()).toBe(true);

    wrapper.setProps({ clusterKubernetesVersion: '5.67.8' });
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:version')?.[1]?.[0]).toBe('5.67.8');
    expect(wrapper.emitted('update:version')).toHaveLength(2);
  });

  it('should offer a checkbox to upgrade the node pool version to match the cluster version if the cluster version is ahead of nodepool version', async() => {
    const setup = requiredSetup();
    const wrapper = shallowMount(GKENodePool, {
      props: {
        clusterKubernetesVersion: '1.23.4',
        version:                  '1.20.4',
        mode:                     _EDIT
      },
      ...setup
    });

    const versionDisplay = wrapper.findComponent<typeof LabeledInput>('[data-testid="gke-k8s-display"]');

    expect(versionDisplay.exists()).toBe(false);

    const versionUpgradeCheckbox = wrapper.findComponent<typeof Checkbox>('[data-testid="gke-k8s-upgrade-checkbox"]');

    expect(versionUpgradeCheckbox.exists()).toBe(true);

    expect(versionUpgradeCheckbox.props().label).toContain('1.23.4');
    expect(versionUpgradeCheckbox.props().label).toContain('1.20.4');

    wrapper.setProps({ clusterKubernetesVersion: '2.34.5' });
    await wrapper.vm.$nextTick();

    expect(versionUpgradeCheckbox.props().label).toContain('2.34.5');
  });

  it('should update the nodepool version to match cluster version when the upgrade checkbox is checked', async() => {
    const setup = requiredSetup();
    const wrapper = shallowMount(GKENodePool, {
      props: {
        clusterKubernetesVersion: '1.23.4',
        version:                  '1.20.4',
        mode:                     _EDIT
      },
      ...setup
    });

    const versionUpgradeCheckbox = wrapper.getComponent<typeof Checkbox>('[data-testid="gke-k8s-upgrade-checkbox"]');

    versionUpgradeCheckbox.vm.$emit('update:value', true);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:version')?.[0]?.[0]).toBe('1.23.4');

    versionUpgradeCheckbox.vm.$emit('update:value', false);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:version')?.[1]?.[0]).toBe('1.20.4');
  });

  it('should use NO_SCHEDULE, PREFER_NO_SCHEDULE, and NO_EXECUTE for taint values', async() => {
    const setup = requiredSetup();
    const wrapper = shallowMount(GKENodePool, {
      props: {
        clusterKubernetesVersion: '1.23.4',
        version:                  '1.20.4',
        mode:                     _EDIT
      },
      ...setup
    });

    const taints = wrapper.getComponent<typeof Taints>('[data-testid="gke-taints-comp"]');

    // the effectValues prop functionality is tested in the Taints component's unit tests
    expect(taints.props().effectValues).toStrictEqual({
      NO_SCHEDULE: 'NoSchedule', PREFER_NO_SCHEDULE: 'PreferNoSchedule', NO_EXECUTE: 'NoExecute'
    });
  });

  it('should disable the pod constraint input when editing existing pools', async() => {
    const setup = requiredSetup();
    const wrapper = shallowMount(GKENodePool, {
      props: { isNew: false },
      ...setup
    });

    let maxPodInput = wrapper.findComponent<typeof LabeledInput>('[data-testid="gke-max-pod-constraint-input"]');

    expect(maxPodInput.exists()).toBe(true);

    expect(maxPodInput.props().disabled).toBe(true);

    wrapper.setProps({ isNew: true });
    await wrapper.vm.$nextTick();

    maxPodInput = wrapper.findComponent<typeof LabeledInput>('[data-testid="gke-max-pod-constraint-input"]');

    expect(maxPodInput.exists()).toBe(true);

    expect(maxPodInput.props().disabled).toBe(false);
  });
});
