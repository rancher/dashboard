import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { useInterval } from '@shell/composables/useInterval';

/**
 * Mount a component that calls useInterval with the given fn and delay.
 * Returns the wrapper so tests can unmount it to trigger onBeforeUnmount.
 */
function makeWrapper(fn: jest.Mock, delay: number) {
  return mount(
    defineComponent({
      setup() {
        useInterval(fn, delay);

        return {};
      },
      template: '<div></div>',
    })
  );
}

describe('useInterval', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('on mount', () => {
    it('starts calling fn at the specified interval after mounting', () => {
      const fn = jest.fn();
      const wrapper = makeWrapper(fn, 1000);

      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);
      expect(fn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(2000);
      expect(fn).toHaveBeenCalledTimes(3);

      wrapper.unmount();
    });

    it('calls fn with the correct delay', () => {
      const fn = jest.fn();
      const wrapper = makeWrapper(fn, 500);

      jest.advanceTimersByTime(499);
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(fn).toHaveBeenCalledTimes(1);

      wrapper.unmount();
    });
  });

  describe('on unmount', () => {
    it('clears the interval so fn is no longer called after unmount', () => {
      const fn = jest.fn();
      const wrapper = makeWrapper(fn, 1000);

      jest.advanceTimersByTime(1000);
      expect(fn).toHaveBeenCalledTimes(1);

      wrapper.unmount();

      jest.advanceTimersByTime(5000);
      // Should stay at 1 — interval was cleared on unmount
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('does not throw when unmounting before interval fires', () => {
      const fn = jest.fn();
      const wrapper = makeWrapper(fn, 10000);

      expect(fn).not.toHaveBeenCalled();
      expect(() => wrapper.unmount()).not.toThrow();
    });
  });

  describe('multiple instances', () => {
    it('runs independent intervals for separate composable instances', () => {
      const fn1 = jest.fn();
      const fn2 = jest.fn();
      const wrapper1 = makeWrapper(fn1, 1000);
      const wrapper2 = makeWrapper(fn2, 2000);

      jest.advanceTimersByTime(2000);
      expect(fn1).toHaveBeenCalledTimes(2);
      expect(fn2).toHaveBeenCalledTimes(1);

      wrapper1.unmount();
      wrapper2.unmount();
    });

    it('stopping one instance does not affect the other', () => {
      const fn1 = jest.fn();
      const fn2 = jest.fn();
      const wrapper1 = makeWrapper(fn1, 1000);
      const wrapper2 = makeWrapper(fn2, 1000);

      jest.advanceTimersByTime(1000);
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);

      wrapper1.unmount();

      jest.advanceTimersByTime(2000);
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(3);

      wrapper2.unmount();
    });
  });
});
