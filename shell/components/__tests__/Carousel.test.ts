import { mount } from '@vue/test-utils';
import Carousel from '@shell/components/Carousel.vue';

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
  },
  {
    key:              'key-4',
    repoName:         'some-repo-name-4',
    chartNameDisplay: 'chart-name-display-4',
    chartDescription: 'chart-description-4'
  }
];

describe('component: Carousel', () => {
  it('should render component with the correct data applied', async() => {
    const wrapper = mount(Carousel, {
      props:  { sliders },
      global: { mocks: { $store: { getters: { clusterId: () => 'some-cluster-id' } } } }
    });

    // testing https://github.com/rancher/dashboard/issues/9975
    sliders.forEach((slider, index) => {
      expect(wrapper.find(`#slide${ index } h1`).text()).toContain(slider.chartNameDisplay);
    });
  });

  it.each([
    [sliders.slice(0, 2)],
    [sliders.slice(0, 3)],
    [sliders.slice(0, 4)],
    [sliders.slice(0, 5)]
  ])('should have the correct width and left position', async(sliders) => {
    const wrapper = mount(Carousel, {
      props:  { sliders },
      global: { mocks: { $store: { getters: { clusterId: () => 'some-cluster-id' } } } }
    });

    const width = 60 * (wrapper.vm.slider.length + 2);
    const initialLeft = -(40 + wrapper.vm.activeItemId * 60);

    expect(wrapper.vm.trackStyle).toContain(`width: ${ width }%`);
    expect(wrapper.vm.trackStyle).toContain(`left: ${ initialLeft }`);

    wrapper.vm.activeItemId = wrapper.vm.activeItemId + 1; // next slide
    expect(wrapper.vm.trackStyle).toContain(`left: ${ -(40 + wrapper.vm.activeItemId * 60) }`);
    wrapper.vm.activeItemId = wrapper.vm.activeItemId - 1; // previous slide
    expect(wrapper.vm.trackStyle).toContain(`left: ${ initialLeft }`);
  });
});
