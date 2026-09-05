import { mount } from '@vue/test-utils';
import IssuanceStatusCard from '../IssuanceStatusCard.vue';

const stage = (labelKey: string, stateSimpleColor: string, state = 'active') => ({
  labelKey,
  resource: {
    stateSimpleColor, state, stateDisplay: state, stateBackground: `bg-${ stateSimpleColor }`, detailLocation: { name: 'x' }
  },
});

const render = (stages: any[], title = 'Issuance Status') => mount(IssuanceStatusCard, {
  props:  { title, stages },
  global: {
    mocks: { t: (key: string) => key },
    stubs: {
      Card:       { template: '<div class="card"><slot /></div>', props: ['title'] },
      SubtleLink: { template: '<a><slot /></a>' },
    },
  },
});

describe('component: IssuanceStatusCard', () => {
  it.each([
    ['success', 'icon-checkmark'],
    ['error', 'icon-error'],
    ['warning', 'icon-warning'],
  ])('should show a coloured status icon for a settled %s stage', (color, expected) => {
    const wrapper = render([stage('a', color)]);

    expect(wrapper.find('.stage .state-icon').classes()).toContain(expected);
  });

  it.each([
    ['info'],
    ['disabled'],
  ])('should show a spinner for a still-working %s stage', (color) => {
    const wrapper = render([stage('a', color)]);
    const classes = wrapper.find('.stage .state-icon').classes();

    expect(classes).toContain('icon-spinner');
    expect(classes).toContain('icon-spin');
  });

  it('should colour each settled icon from its stage state', () => {
    const wrapper = render([stage('a', 'success')]);

    expect(wrapper.find('.stage .state-icon').classes()).toContain('state-icon--success');
  });

  it('should leave a still-working icon muted rather than colouring it', () => {
    // A pending/in-progress stage shows a neutral spinner; only settled stages take a state colour.
    const wrapper = render([stage('a', 'info', 'pending')]);
    const classes = wrapper.find('.stage .state-icon').classes();

    expect(classes.some((c) => c.startsWith('state-icon--'))).toBe(false);
  });

  it('should render one row per applicable stage', () => {
    const wrapper = render([stage('a', 'success'), stage('b', 'success'), stage('c', 'info')]);

    expect(wrapper.findAll('.stage')).toHaveLength(3);
  });

  it('should link a settled stage to its resource and show its state badge', () => {
    const wrapper = render([stage('a', 'success')]);

    expect(wrapper.find('.stage a').exists()).toBe(true);
    expect(wrapper.find('.stage .badge-state').exists()).toBe(true);
  });

  it('should render a still-working stage as plain text rather than a link', () => {
    // A pending stage has nothing to show yet, so its label is not navigable.
    const wrapper = render([stage('a', 'info', 'pending')]);

    expect(wrapper.find('.stage a').exists()).toBe(false);
    expect(wrapper.find('.stage span.label').text()).toBe('a');
    expect(wrapper.find('.stage .badge-state').exists()).toBe(true);
  });
});
