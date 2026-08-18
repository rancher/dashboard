import { mount } from '@vue/test-utils';
import IssuanceProgress from '../IssuanceProgress.vue';

const stage = (labelKey: string, stateSimpleColor: string, state = 'active') => ({
  labelKey,
  resource: {
    stateSimpleColor, state, stateDisplay: state, stateBackground: `bg-${ stateSimpleColor }`, detailLocation: { name: 'x' }
  },
});

const render = (stages: any[]) => mount(IssuanceProgress, {
  props:  { stages },
  global: {
    mocks: { t: (key: string) => key },
    stubs: {
      SubtleLink: { template: '<a><slot /></a>' },
      BadgeState: { template: '<span class="badge" />' },
    },
  },
});

describe('component: IssuanceProgress', () => {
  it.each([
    ['success', 'icon-checkmark'],
    ['error', 'icon-error'],
    ['warning', 'icon-warning'],
    ['info', 'icon-dot-open'],
    ['disabled', 'icon-dot-open'],
  ])('should use a static icon for a %s step', (color, expected) => {
    const wrapper = render([stage('a', color)]);

    expect(wrapper.find('.marker .icon').classes()).toContain(expected);
  });

  it('should never animate a marker', () => {
    // A spinner on some steps and not others reads as a rendering glitch rather than progress.
    const wrapper = render([stage('a', 'info', 'in-progress'), stage('b', 'info', 'pending')]);

    expect(wrapper.html()).not.toContain('icon-spin');
  });

  it('should draw one connector fewer than it has steps', () => {
    const wrapper = render([stage('a', 'success'), stage('b', 'success'), stage('c', 'info')]);

    expect(wrapper.findAll('.marker')).toHaveLength(3);
    expect(wrapper.findAll('.connector')).toHaveLength(2);
  });

  it('should colour each connector from the step it leads out of', () => {
    const wrapper = render([stage('a', 'success'), stage('b', 'error')]);

    expect(wrapper.find('.connector').classes()).toContain('connector--success');
  });
});
