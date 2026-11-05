import { shallowMount } from '@vue/test-utils';
import RcProgressBar from './RcProgressBar.vue';
import type { RcProgressBarProps } from './types';

function mountBar(props: Partial<RcProgressBarProps> = {}) {
  return shallowMount(RcProgressBar, {
    props: {
      value: 40, ariaLabel: 'Upgrade progress', ...props
    }
  });
}

function fillWidth(wrapper: ReturnType<typeof mountBar>): string {
  return (wrapper.find('.fill').element as HTMLElement).style.width;
}

describe('component: RcProgressBar', () => {
  it('renders the progressbar role with its accessible name', () => {
    const wrapper = mountBar();

    expect(wrapper.attributes('role')).toBe('progressbar');
    expect(wrapper.attributes('aria-label')).toBe('Upgrade progress');
  });

  it('defaults the range to 0 to 100', () => {
    const wrapper = mountBar();

    expect(wrapper.attributes('aria-valuenow')).toBe('40');
    expect(wrapper.attributes('aria-valuemin')).toBe('0');
    expect(wrapper.attributes('aria-valuemax')).toBe('100');
    expect(fillWidth(wrapper)).toBe('40%');
  });

  it.each([
    [0, '0%'],
    [100, '100%'],
    [25, '25%'],
  ])('fills the bar to match a value of %s', (value, expected) => {
    expect(fillWidth(mountBar({ value }))).toBe(expected);
  });

  it('fills the bar relative to a custom range', () => {
    const wrapper = mountBar({
      value: 3, min: 1, max: 9
    });

    expect(wrapper.attributes('aria-valuenow')).toBe('3');
    expect(wrapper.attributes('aria-valuemin')).toBe('1');
    expect(wrapper.attributes('aria-valuemax')).toBe('9');
    expect(fillWidth(wrapper)).toBe('25%');
  });

  it.each([
    ['above max', 150, '100', '100%'],
    ['below min', -20, '0', '0%'],
    ['infinite', Infinity, '100', '100%'],
    ['negative infinite', -Infinity, '0', '0%'],
    ['NaN', NaN, '0', '0%'],
  ])('clamps a value %s', (_label, value, valueNow, width) => {
    const wrapper = mountBar({ value });

    expect(wrapper.attributes('aria-valuenow')).toBe(valueNow);
    expect(fillWidth(wrapper)).toBe(width);
  });

  it.each([
    ['equal to min', 5],
    ['below min', 2],
  ])('shows an empty bar with a consistent range when max is %s', (_label, max) => {
    const wrapper = mountBar({
      value: 4, min: 5, max
    });

    expect(wrapper.attributes('aria-valuenow')).toBe('5');
    expect(wrapper.attributes('aria-valuemin')).toBe('5');
    expect(wrapper.attributes('aria-valuemax')).toBe('5');
    expect(fillWidth(wrapper)).toBe('0%');
  });

  it.each([
    ['NaN', NaN],
    ['infinite', Infinity],
    ['negative infinite', -Infinity],
  ])('treats a %s min as 0', (_label, min) => {
    const wrapper = mountBar({ value: 40, min });

    expect(wrapper.attributes('aria-valuemin')).toBe('0');
    expect(wrapper.attributes('aria-valuenow')).toBe('40');
    expect(fillWidth(wrapper)).toBe('40%');
  });

  it.each([
    ['NaN', NaN],
    ['infinite', Infinity],
    ['negative infinite', -Infinity],
  ])('shows an empty bar when max is %s', (_label, max) => {
    const wrapper = mountBar({ value: 40, max });

    expect(wrapper.attributes('aria-valuenow')).toBe('0');
    expect(wrapper.attributes('aria-valuemin')).toBe('0');
    expect(wrapper.attributes('aria-valuemax')).toBe('0');
    expect(fillWidth(wrapper)).toBe('0%');
  });

  it('has no accessible name of its own when ariaLabel is not given', () => {
    const wrapper = shallowMount(RcProgressBar, { props: { value: 40 }, attrs: { 'aria-labelledby': 'upgrade-label' } });

    expect(wrapper.attributes('aria-label')).toBeUndefined();
    expect(wrapper.attributes('aria-labelledby')).toBe('upgrade-label');
  });

  it('updates the fill and ARIA values when its props change', async() => {
    const wrapper = mountBar();

    await wrapper.setProps({
      value: 30, max: 60, color: 'error'
    });

    expect(wrapper.attributes('aria-valuenow')).toBe('30');
    expect(wrapper.attributes('aria-valuemax')).toBe('60');
    expect(fillWidth(wrapper)).toBe('50%');
    expect(wrapper.find('.fill').attributes('style')).toContain('--fill-color: var(--rc-bar-status-error)');
  });

  it('passes aria-valuetext through when it is given', () => {
    const wrapper = mountBar({ ariaValuetext: '2 of 5 nodes upgraded' });

    expect(wrapper.attributes('aria-valuetext')).toBe('2 of 5 nodes upgraded');
  });

  it('omits aria-valuetext by default', () => {
    expect(mountBar().attributes('aria-valuetext')).toBeUndefined();
  });

  it.each([
    [undefined, 'var(--rc-bar-status-info)'],
    ['success' as const, 'var(--rc-bar-status-success)'],
    ['critical' as const, 'var(--rc-bar-severity-critical)'],
    ['--primary' as const, 'var(--primary)'],
  ])('fills the bar with color %s', (color, expected) => {
    const wrapper = mountBar({ color });

    expect(wrapper.find('.fill').attributes('style')).toContain(`--fill-color: ${ expected }`);
  });

  it.each([
    [undefined, 'small', 'medium'],
    ['small' as const, 'small', 'medium'],
    ['medium' as const, 'medium', 'small'],
  ])('applies only the size class for size %s', (size, expected, absent) => {
    const wrapper = mountBar({ size });

    expect(wrapper.classes()).toContain(expected);
    expect(wrapper.classes()).not.toContain(absent);
  });
});
