
import { ref } from 'vue';
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
    const statuses: Status[] = [
      'info',
      'success',
      'warning',
      'error',
      'unknown',
      'none'
    ];

    it.each(statuses)('solid: should return the correct colors for status: %p', (status) => {
      const statusRef = ref(status as Status);
      const {
        borderColor,
        backgroundColor,
        textColor
      } = useStatusColors(statusRef, 'solid');

      expect(borderColor.value).toBe(`var(--rc-${ status })`);
      if (status !== 'none') {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(backgroundColor.value).toBe(`var(--rc-${ status })`);
      }
      expect(textColor.value).toBe(`var(--rc-${ status }-secondary)`);
    });

    it.each(statuses)('outlined: should return the correct colors for status: %p', (status) => {
      const statusRef = ref(status as Status);
      const {
        borderColor,
        backgroundColor,
        textColor
      } = useStatusColors(statusRef, 'outlined');

      expect(borderColor.value).toBe(`var(--rc-${ status }-secondary)`);
      if (status !== 'none') {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(backgroundColor.value).toBe(`var(--rc-${ status }-secondary)`);
      }
      expect(textColor.value).toBe(`var(--rc-${ status })`);
    });
  });
});
