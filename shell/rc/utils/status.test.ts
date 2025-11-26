
import { reactive } from 'vue';
import { wrapIfVar, useStatusColors, Status } from './status';

describe('utils: status', () => {
  describe('wrapIfVar', () => {
    it('should wrap a CSS variable', () => {
      const result = wrapIfVar('--rc-info');

      expect(result).toBe('var(--rc-info)');
    });

    it('should not wrap a normal color', () => {
      const result = wrapIfVar('red');

      expect(result).toBe('red');
    });
  });

  describe('useStatusColors', () => {
    it.each([
      'info',
      'success',
      'warning',
      'error',
      'unknown',
      'none'
    ])('solid: should return the correct colors for status: %p', (status: Status) => {
      const props = reactive({ status });
      const {
        borderColor,
        backgroundColor,
        textColor
      } = useStatusColors(props, 'solid');

      expect(borderColor.value).toBe(`var(--rc-${ status })`);
      if (status !== 'none') {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(backgroundColor.value).toBe(`var(--rc-${ status })`);
      }
      expect(textColor.value).toBe(`var(--rc-${ status }-secondary)`);
    });

    it.each([
      'info',
      'success',
      'warning',
      'error',
      'unknown',
      'none'
    ])('outlined: should return the correct colors for status: %p', (status: Status) => {
      const props = reactive({ status });
      const {
        borderColor,
        backgroundColor,
        textColor
      } = useStatusColors(props, 'outlined');

      expect(borderColor.value).toBe(`var(--rc-${ status }-secondary)`);
      if (status !== 'none') {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(backgroundColor.value).toBe(`var(--rc-${ status }-secondary)`);
      }
      expect(textColor.value).toBe(`var(--rc-${ status })`);
    });
  });
});
