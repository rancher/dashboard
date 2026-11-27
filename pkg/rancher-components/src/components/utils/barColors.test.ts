import { barColorValue } from './barColors';

describe('barColorValue', () => {
  it.each([
    ['error' as const, 'var(--rc-bar-status-error)'],
    ['unknown' as const, 'var(--rc-bar-status-unknown)'],
    ['low' as const, 'var(--rc-bar-severity-low)'],
    ['--my-color' as const, 'var(--my-color)'],
  ])('resolves %s to %s', (color, expected) => {
    expect(barColorValue(color)).toBe(expected);
  });
});
