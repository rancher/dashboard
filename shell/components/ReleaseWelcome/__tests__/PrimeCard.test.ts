import { shallowMount } from '@vue/test-utils';
import PrimeCard from '@shell/components/ReleaseWelcome/PrimeCard.vue';

const createWrapper = () => shallowMount(PrimeCard, { slots: { default: '<h3>Title</h3>' } });

describe('component: PrimeCard', () => {
  // The card looks the same in every theme and brand
  it('should apply the SUSE Rancher Prime theme on top of the dark theme', () => {
    const wrapper = createWrapper();

    expect(wrapper.classes()).toStrictEqual(['prime-card', 'theme-dark', 'theme-suse-prime']);
  });

  it('should render the content', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('h3').text()).toStrictEqual('Title');
  });
});
