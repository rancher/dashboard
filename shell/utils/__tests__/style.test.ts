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
    ['disabled', 'info', false],
    ['disabled', 'error', false],
    ['info', 'disabled', true],
    ['error', 'disabled', true],
  ] as [StateColor, StateColor, boolean][])('%s vs %s → %s', (a, b, expected) => {
    expect(isHigherAlert(a, b)).toBe(expected);
  });
});

describe('getHighestAlertColor', () => {
  it.each([
    {
      desc: 'info for an empty array', colors: [], expected: 'info'
    },
    {
      desc: 'error when single error element', colors: ['error'], expected: 'error'
    },
    {
      desc: 'warning when single warning element', colors: ['warning'], expected: 'warning'
    },
    {
      desc: 'error when present among mixed levels', colors: ['info', 'warning', 'error', 'success'], expected: 'error'
    },
    {
      desc: 'warning when no error is present', colors: ['info', 'success', 'warning'], expected: 'warning'
    },
    {
      desc: 'success when only info and success are present', colors: ['info', 'success'], expected: 'success'
    },
    {
      desc: 'info when all colors are info', colors: ['info', 'info', 'info'], expected: 'info'
    },
    {
      desc: 'info (default) when all colors are disabled', colors: ['disabled', 'disabled'], expected: 'info'
    },
  ])('returns $desc', ({ colors, expected }) => {
    expect(getHighestAlertColor(colors as StateColor[])).toBe(expected);
  });
});

describe('isTruncated', () => {
  it('returns false when element is null', () => {
    expect(isTruncated(null)).toBe(false);
  });

  it.each([
    {
      desc: 'false when text fits within element bounds',
      el:   {
        scrollWidth: 100, clientWidth: 200, scrollHeight: 20, clientHeight: 20
      },
      expected: false,
    },
    {
      desc: 'true when text is horizontally truncated',
      el:   {
        scrollWidth: 300, clientWidth: 200, scrollHeight: 20, clientHeight: 20
      },
      expected: true,
    },
    {
      desc: 'true when text is vertically truncated',
      el:   {
        scrollWidth: 100, clientWidth: 100, scrollHeight: 50, clientHeight: 40
      },
      expected: true,
    },
    {
      desc: 'false for single-pixel vertical overflow (1px tolerance)',
      el:   {
        scrollWidth: 100, clientWidth: 100, scrollHeight: 21, clientHeight: 20
      },
      expected: false,
    },
    {
      desc: 'true for 2+ pixel vertical overflow',
      el:   {
        scrollWidth: 100, clientWidth: 100, scrollHeight: 22, clientHeight: 20
      },
      expected: true,
    },
  ])('returns $desc', ({ el, expected }) => {
    expect(isTruncated(el as HTMLElement)).toBe(expected);
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
