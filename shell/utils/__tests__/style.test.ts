import {
  ALL_STATE_COLORS,
  BLANK_IMAGE,
  StateColor,
  getHighestAlertColor,
  isHigherAlert,
  isTruncated,
  stateColorCssVar,
  toBgColor,
} from '@shell/utils/style';

describe('stateColorCssVar', () => {
  it.each([
    ['success', 'var(--success)'],
    ['warning', 'var(--warning)'],
    ['error', 'var(--error)'],
    ['info', 'var(--info)'],
    ['disabled', 'var(--disabled)'],
  ] as [StateColor, string][])('returns css var for %s', (color, expected) => {
    expect(stateColorCssVar(color)).toBe(expected);
  });
});

describe('toBgColor', () => {
  it('returns bg-info when no color provided', () => {
    expect(toBgColor(undefined)).toBe('bg-info');
  });

  it.each([
    ['success', 'bg-success'],
    ['warning', 'bg-warning'],
    ['error', 'bg-error'],
    ['info', 'bg-info'],
    ['disabled', 'bg-disabled'],
  ] as [StateColor, string][])('returns bg-%s for color %s', (color, expected) => {
    expect(toBgColor(color)).toBe(expected);
  });
});

describe('isHigherAlert', () => {
  it.each([
    ['error', 'warning', true],
    ['error', 'success', true],
    ['error', 'info', true],
    ['warning', 'success', true],
    ['warning', 'info', true],
    ['success', 'info', true],
    ['warning', 'error', false],
    ['success', 'error', false],
    ['info', 'error', false],
    ['success', 'warning', false],
    ['info', 'warning', false],
    ['info', 'success', false],
    ['error', 'error', false],
    ['warning', 'warning', false],
    ['info', 'info', false],
  ] as [StateColor, StateColor, boolean][])('%s vs %s → %s', (a, b, expected) => {
    expect(isHigherAlert(a, b)).toBe(expected);
  });

  it('returns false when a is disabled (not in alert order)', () => {
    expect(isHigherAlert('disabled', 'info')).toBe(false);
    expect(isHigherAlert('disabled', 'error')).toBe(false);
  });

  it('returns true when b is disabled and a is in the alert order', () => {
    expect(isHigherAlert('info', 'disabled')).toBe(true);
    expect(isHigherAlert('error', 'disabled')).toBe(true);
  });
});

describe('getHighestAlertColor', () => {
  it('returns info for an empty array', () => {
    expect(getHighestAlertColor([])).toBe('info');
  });

  it('returns the only color when array has one element', () => {
    expect(getHighestAlertColor(['error'])).toBe('error');
    expect(getHighestAlertColor(['warning'])).toBe('warning');
  });

  it('returns error when it is present among mixed levels', () => {
    expect(getHighestAlertColor(['info', 'warning', 'error', 'success'])).toBe('error');
  });

  it('returns warning when no error is present', () => {
    expect(getHighestAlertColor(['info', 'success', 'warning'])).toBe('warning');
  });

  it('returns success when only info and success are present', () => {
    expect(getHighestAlertColor(['info', 'success'])).toBe('success');
  });

  it('returns info when all colors are info', () => {
    expect(getHighestAlertColor(['info', 'info', 'info'])).toBe('info');
  });

  it('returns info (default) when all colors are disabled', () => {
    // disabled is not in the alert order; default stays info
    expect(getHighestAlertColor(['disabled', 'disabled'])).toBe('info');
  });
});

describe('isTruncated', () => {
  it('returns false when element is null', () => {
    expect(isTruncated(null)).toBe(false);
  });

  it('returns false when text fits within element bounds', () => {
    const el = {
      scrollWidth: 100, clientWidth: 200, scrollHeight: 20, clientHeight: 20
    } as HTMLElement;

    expect(isTruncated(el)).toBe(false);
  });

  it('returns true when text is horizontally truncated', () => {
    const el = {
      scrollWidth: 300, clientWidth: 200, scrollHeight: 20, clientHeight: 20
    } as HTMLElement;

    expect(isTruncated(el)).toBe(true);
  });

  it('returns true when text is vertically truncated', () => {
    const el = {
      scrollWidth: 100, clientWidth: 100, scrollHeight: 50, clientHeight: 40
    } as HTMLElement;

    expect(isTruncated(el)).toBe(true);
  });

  it('handles single-pixel vertical overflow as not truncated', () => {
    // The check is scrollHeight - clientHeight > 1, so exactly 1px difference is not truncated
    const el = {
      scrollWidth: 100, clientWidth: 100, scrollHeight: 21, clientHeight: 20
    } as HTMLElement;

    expect(isTruncated(el)).toBe(false);
  });

  it('handles 2+ pixel vertical overflow as truncated', () => {
    const el = {
      scrollWidth: 100, clientWidth: 100, scrollHeight: 22, clientHeight: 20
    } as HTMLElement;

    expect(isTruncated(el)).toBe(true);
  });
});

describe('all state colors constant', () => {
  it('contains all expected state colors', () => {
    expect(ALL_STATE_COLORS).toStrictEqual(['success', 'warning', 'error', 'info', 'disabled']);
  });
});

describe('blank image constant', () => {
  it('is a valid base64 data URI', () => {
    expect(BLANK_IMAGE).toMatch(/^data:image\//);
    expect(BLANK_IMAGE).toContain('base64,');
  });
});
