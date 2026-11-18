import { mount } from '@vue/test-utils';
import type { Status } from '@components/utils/status';
import RcCounterBadge from './index';
import { Type } from '../types';

describe('component: RcCounterBadge', () => {
  const types: Type[] = ['active', 'inactive'];

  it.each(types)('should apply correct classes for type "%s"', (type) => {
    const wrapper = mount(RcCounterBadge, { props: { type, count: 1 } });

    const shapeEl = wrapper.find('.rc-counter-badge');

    expect(shapeEl.classes()).toContain(type);
  });

  it('should apply the correct class for disabled', () => {
    const wrapper = mount(RcCounterBadge, {
      props: {
        type: 'active', disabled: true, count: 1
      }
    });

    const shapeEl = wrapper.find('.rc-counter-badge');

    expect(shapeEl.classes()).toContain('disabled');
  });

  it('should show the correct count below 1000', () => {
    const count = 999;
    const wrapper = mount(RcCounterBadge, {
      props: {
        type: 'active', disabled: true, count
      }
    });

    const shapeEl = wrapper.find('.rc-counter-badge');

    expect(shapeEl.text()).toBe(count.toString());
  });

  it('should show the correct count at or above 1000', () => {
    const count = 1000;
    const wrapper = mount(RcCounterBadge, {
      props: {
        type: 'active', disabled: true, count
      }
    });

    const shapeEl = wrapper.find('.rc-counter-badge');

    expect(shapeEl.text()).toBe('999+');
  });

  describe('accessible name', () => {
    let warn: jest.SpyInstance;

    beforeEach(() => {
      warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => warn.mockRestore());

    it('should name the badge when an ariaLabel is given', () => {
      const wrapper = mount(RcCounterBadge, {
        props: {
          type: 'inactive', count: 3, ariaLabel: '3 failed clusters'
        }
      });

      expect(wrapper.find('.rc-counter-badge').attributes('aria-label')).toBe('3 failed clusters');
    });

    it('should leave the badge unnamed when no ariaLabel is given', () => {
      const wrapper = mount(RcCounterBadge, { props: { type: 'inactive', count: 3 } });

      expect(wrapper.find('.rc-counter-badge').attributes('aria-label')).toBeUndefined();
    });

    it('should warn when a status is set without an ariaLabel to carry it', () => {
      mount(RcCounterBadge, {
        props: {
          type: 'inactive', count: 3, status: 'error'
        }
      });

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[RcCounterBadge]'));
    });

    it('should not warn when a status is set with an ariaLabel', () => {
      mount(RcCounterBadge, {
        props: {
          type: 'inactive', count: 3, status: 'error', ariaLabel: '3 clusters in error'
        }
      });

      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('[RcCounterBadge]'));
    });

    it('should not warn when no status is set and no ariaLabel is given', () => {
      mount(RcCounterBadge, { props: { type: 'inactive', count: 3 } });

      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('[RcCounterBadge]'));
    });
  });

  describe('colors', () => {
    // The colours reach the DOM through `v-bind()` in the style block, which the
    // unit test environment does not evaluate, so assert the resolved values the
    // way RcIcon's tests do.
    const colorsOf = (wrapper: ReturnType<typeof mount>) => {
      const vm = wrapper.vm as unknown as { backgroundColor: string; borderColor: string; textColor: string; hoverBorderColor: string };

      return {
        background: vm.backgroundColor, border: vm.borderColor, text: vm.textColor
      };
    };

    it('should take the type colors when neither a status nor an override is given', () => {
      const wrapper = mount(RcCounterBadge, { props: { type: 'inactive', count: 1 } });

      expect(colorsOf(wrapper)).toStrictEqual({
        background: 'var(--rc-counter-badge-inactive-background, var(--rc-inactive-background))',
        border:     'var(--rc-counter-badge-inactive-border, var(--rc-inactive-border))',
        text:       'var(--body-text)',
      });
    });

    it('should leave an ancestor no way into an active badge', () => {
      const wrapper = mount(RcCounterBadge, { props: { type: 'active', count: 1 } });

      expect(colorsOf(wrapper).background).toBe('var(--rc-active-background)');
    });

    it.each([
      ['warning', 'var(--rc-warning-secondary)', 'var(--rc-warning)'],
      ['error', 'var(--rc-error-secondary)', 'var(--rc-error)'],
    ] as [Status, string, string][])('should take the outlined status colors for status "%s"', (status, secondary, primary) => {
      const wrapper = mount(RcCounterBadge, {
        props: {
          type: 'inactive', count: 1, status, ariaLabel: `1 item, ${ status }`
        }
      });

      expect(colorsOf(wrapper)).toStrictEqual({
        background: secondary, border: secondary, text: primary
      });
    });

    it('should let a full override replace every status color', () => {
      const wrapper = mount(RcCounterBadge, {
        props: {
          type:            'inactive',
          count:           1,
          status:          'warning',
          ariaLabel:       '1 item needing attention',
          backgroundColor: '#FFF',
          borderColor:     'var(--rc-active-border)',
          textColor:       'rebeccapurple',
        }
      });

      expect(colorsOf(wrapper)).toStrictEqual({
        background: '#FFF', border: 'var(--rc-active-border)', text: 'rebeccapurple'
      });
    });

    it('should override only the colors it is given, leaving the rest to the type', () => {
      const wrapper = mount(RcCounterBadge, {
        props: {
          type: 'inactive', count: 1, backgroundColor: 'var(--rc-section-background-primary)'
        }
      });

      expect(colorsOf(wrapper)).toStrictEqual({
        background: 'var(--rc-section-background-primary)',
        border:     'var(--rc-counter-badge-inactive-border, var(--rc-inactive-border))',
        text:       'var(--body-text)',
      });
    });

    it.each([
      ['active', 'var(--rc-active-disabled-background)', 'var(--rc-active-border)'],
      ['inactive', 'var(--rc-inactive-background)', 'var(--rc-inactive-disabled-border)'],
    ] as [Type, string, string][])('should take the disabled colors for a disabled "%s" badge', (type, background, border) => {
      const wrapper = mount(RcCounterBadge, {
        props: {
          type, count: 1, disabled: true
        }
      });

      expect(colorsOf(wrapper)).toStrictEqual({
        background, border, text: 'var(--rc-disabled-text-color)'
      });
    });

    it('should keep the hover border on its own token unless a colour is given', () => {
      const plain = mount(RcCounterBadge, { props: { type: 'active', count: 1 } });
      const overridden = mount(RcCounterBadge, {
        props: {
          type: 'active', count: 1, borderColor: 'rebeccapurple'
        }
      });

      expect((plain.vm as unknown as { hoverBorderColor: string }).hoverBorderColor).toBe('var(--rc-primary-hover)');
      expect((overridden.vm as unknown as { hoverBorderColor: string }).hoverBorderColor).toBe('rebeccapurple');
    });
  });
});
