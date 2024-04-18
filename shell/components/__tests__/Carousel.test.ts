import { mount } from '@vue/test-utils';
import Carousel from '@shell/components/Carousel.vue';

describe('component: Carousel', () => {
  it('should render component with the correct data applied', async() => {
    const sliders = [
      {
        key:              'key-0',
        repoName:         'some-repo-name-0',
        chartNameDisplay: 'chart-name-display-0',
        chartDescription: 'chart-description-0'
      },
      {
        key:              'key-1',
        repoName:         'some-repo-name-1',
        chartNameDisplay: 'chart-name-display-1',
        chartDescription: 'chart-description-1'
      },
      {
        key:              'key-2',
        repoName:         'some-repo-name-2',
        chartNameDisplay: 'chart-name-display-2',
        chartDescription: 'chart-description-2'
      },
      {
        key:              'key-3',
        repoName:         'some-repo-name-3',
        chartNameDisplay: 'chart-name-display-3',
        chartDescription: 'chart-description-3'
      }
    ];

    const wrapper = mount(Carousel, {
      propsData: { sliders },
      mocks:     { $store: { getters: { clusterId: () => 'some-cluster-id' } } }
    });

    // testing https://github.com/rancher/dashboard/issues/9975
    sliders.forEach((slider, index) => {
      expect(wrapper.find(`#slide${ index } h1`).text()).toContain(slider.chartNameDisplay);
    });
  });
});
