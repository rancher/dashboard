import { shallowMount } from '@vue/test-utils';
import Logging from '@shell/chart/logging/index.vue';

describe('chart: Logging', () => {
  it('tKE provider set loggingOverlay1', async() => {
    const provider = '';
    const clusterType = 'tke';
    const wrapper = shallowMount(Logging, {
      propsData: { value: {} },
      computed:  {
        currentCluster() {
          return { status: { provider } };
        }
      }
    });

    wrapper.setData({ clusterType });
    await wrapper.vm.$nextTick();

    expect(wrapper.props().value.loggingOverlay.spec.fluentbit.extraVolumeMounts[0].source)
      .toBe('/var/lib/containerd');
  });

  it('tKE provider set loggingOverlay2', async() => {
    const provider = 'tke';
    // const clusterType = '';
    const wrapper = shallowMount(Logging, {
      propsData: { value: {} },
      computed:  {
        currentCluster() {
          return { status: { provider } };
        },
      }
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.props().value.loggingOverlay.spec.fluentbit.extraVolumeMounts[0].source)
      .toBe('/var/lib/containerd');
  });

  it('tKE provider set loggingOverlay3', async() => {
    const provider = 'tke';
    const clusterType = 'tke';
    const wrapper = shallowMount(Logging, {
      propsData: { value: {} },
      computed:  {
        currentCluster() {
          return { status: { provider } };
        },
      }
    });

    wrapper.setData({ clusterType });
    await wrapper.vm.$nextTick();

    expect(wrapper.props().value.loggingOverlay.spec.fluentbit.extraVolumeMounts[0].source)
      .toBe('/var/lib/containerd');
  });

  it('tKE provider remove loggingOverlay1', async() => {
    const provider = 'tke';
    const clusterType = '';
    const wrapper = shallowMount(Logging, {
      propsData: { value: {} },
      computed:  {
        currentCluster() {
          return { status: { provider } };
        },
      }
    });

    wrapper.setData({ clusterType });
    await wrapper.vm.$nextTick();

    expect(wrapper.props().value.loggingOverlay)
      .toBeUndefined();
  });

  it('tKE provider remove loggingOverlay2', async() => {
    const provider = '';
    const wrapper = shallowMount(Logging, {
      propsData: { value: {} },
      computed:  {
        currentCluster() {
          return { status: { provider } };
        },
      }
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.props().value.loggingOverlay)
      .toBeUndefined();
  });
});
