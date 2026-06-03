import { shallowMount } from '@vue/test-utils';
import AppCoEmptyState from '@shell/components/fleet/AppCoEmptyState.vue';

describe('component: AppCoEmptyState', () => {
  it('should match snapshot with no badge state', () => {
    const wrapper = shallowMount(AppCoEmptyState, {
      props: { title: 'No charts found' },
      slots: { default: 'Try a different search' },
    });

    expect(wrapper.element).toMatchSnapshot();
  });

  it('should match snapshot with transitioning badge state', () => {
    const wrapper = shallowMount(AppCoEmptyState, {
      props: {
        title:      'Loading charts',
        badgeState: {
          transitioning:   true,
          error:           false,
          stateBackground: 'bg-info',
          stateDisplay:    'In Progress',
        },
      },
      slots: { default: 'Please wait...' },
    });

    expect(wrapper.element).toMatchSnapshot();
  });

  it('should match snapshot with error badge state', () => {
    const wrapper = shallowMount(AppCoEmptyState, {
      props: {
        title:      'Error',
        badgeState: {
          transitioning:   false,
          error:           true,
          stateBackground: 'bg-error',
          stateDisplay:    'Failed',
        },
      },
      slots: { default: 'Something went wrong' },
    });

    expect(wrapper.element).toMatchSnapshot();
  });

  it('should render h1 when no badge state', () => {
    const wrapper = shallowMount(AppCoEmptyState, {
      props: { title: 'Empty' },
    });

    expect(wrapper.find('h1').exists()).toBe(true);
    expect(wrapper.find('h2').exists()).toBe(false);
  });

  it('should render h2 when badge state is transitioning', () => {
    const wrapper = shallowMount(AppCoEmptyState, {
      props: {
        title:      'Loading',
        badgeState: {
          transitioning:   true,
          error:           false,
          stateBackground: 'bg-info',
          stateDisplay:    'Loading',
        },
      },
    });

    expect(wrapper.find('h2').exists()).toBe(true);
    expect(wrapper.find('h1').exists()).toBe(false);
  });
});
