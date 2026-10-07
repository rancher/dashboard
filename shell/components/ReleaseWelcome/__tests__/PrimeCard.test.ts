import { shallowMount } from '@vue/test-utils';
import PrimeCard from '@shell/components/ReleaseWelcome/PrimeCard.vue';

let mockStore: any;

jest.mock('vuex', () => ({ ...jest.requireActual('vuex'), useStore: () => mockStore }));

const createWrapper = (brand?: string) => {
  mockStore = { getters: { 'management/brand': brand } };

  return shallowMount(PrimeCard, { slots: { default: '<h3>Title</h3>' } });
};

describe('component: PrimeCard', () => {
  // The card is dark in both themes
  it('should apply the dark theme to the card', () => {
    const wrapper = createWrapper();

    expect(wrapper.classes()).toStrictEqual(['prime-card', 'theme-dark']);
  });

  it('should apply the brand to the card, for brand specific dark theme variables', () => {
    const wrapper = createWrapper('suse');

    expect(wrapper.classes()).toStrictEqual(['prime-card', 'theme-dark', 'suse']);
  });

  it('should render the content', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('h3').text()).toStrictEqual('Title');
  });
});
