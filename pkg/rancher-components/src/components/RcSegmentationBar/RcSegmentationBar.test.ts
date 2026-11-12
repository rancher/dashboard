import { shallowMount } from '@vue/test-utils';
import RcSegmentationBar from './RcSegmentationBar.vue';
import type { RcSegment, RcSegmentColor, RcSegmentationBarProps } from './types';

const mockTranslate = jest.fn();

jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string, args: Record<string, unknown>, raw?: boolean) => mockTranslate(key, args, raw) }) }));

function translateSegment(key: string, args: Record<string, unknown>): string {
  return `${ args.label }: ${ args.value }`;
}

const store = { getters: { 'i18n/current': () => 'en-us' } };

function mountBar(props: Partial<RcSegmentationBarProps> = {}) {
  return shallowMount(RcSegmentationBar, {
    props:  { segments: statusSegments, ...props },
    global: { provide: { store } },
  });
}

function growValues(wrapper: ReturnType<typeof mountBar>): number[] {
  return wrapper.findAll('.segment').map((segment) => parseFloat((segment.element as HTMLElement).style.flexGrow));
}

function segment(value: number, color: RcSegmentColor = 'info', label = 'Info'): RcSegment {
  return {
    value, color, label
  };
}

const statusSegments: RcSegment[] = [
  segment(2, 'error', 'Error'),
  segment(5, 'warning', 'Warning'),
  segment(1, 'success', 'Success'),
];

describe('component: RcSegmentationBar', () => {
  beforeEach(() => {
    mockTranslate.mockReset();
    mockTranslate.mockImplementation(translateSegment);
  });

  it('renders one element per segment', () => {
    const wrapper = mountBar();

    expect(wrapper.findAll('.segment')).toHaveLength(3);
  });

  it.each([
    ['whole numbers', [2, 5, 1], [25, 62.5, 12.5]],
    ['fractions summing to less than one', [0.2, 0.3], [40, 60]],
    ['a single value', [7], [100]],
    ['very large values', [Number.MAX_VALUE, Number.MAX_VALUE], [50, 50]],
    ['very small values', [Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE * 2], [25, 25, 50]],
  ])('sizes segments in proportion to their values for %s', (_label, values, expected) => {
    const wrapper = mountBar({ segments: values.map((value) => segment(value)) });
    const grow = growValues(wrapper);

    expect(grow).toHaveLength(expected.length);
    grow.forEach((value, index) => expect(value).toBeCloseTo(expected[index]));
    expect(grow.reduce((sum, value) => sum + value, 0)).toBeCloseTo(100);
  });

  it.each([
    ['zero', 0],
    ['negative', -3],
    ['NaN', NaN],
    ['infinite', Infinity],
    ['negative infinite', -Infinity],
  ])('gives a segment with a %s value no width', (_label, value) => {
    const wrapper = mountBar({ segments: [segment(4), segment(value, 'error', 'Error')] });

    expect(growValues(wrapper)).toStrictEqual([100, 0]);
  });

  it.each([
    ['zero', 0, true],
    ['positive', 2, false],
  ])('marks a segment with a %s value as empty: %s', (_label, value, empty) => {
    const wrapper = mountBar({ segments: [segment(4), segment(value, 'error', 'Error')] });

    expect(wrapper.find('[data-testid="rc-segmentation-bar-segment-1"]').classes('empty')).toBe(empty);
  });

  it('keeps the same element when a segment changes to and from zero', async() => {
    const wrapper = mountBar({ segments: [segment(4), segment(0, 'error', 'Error')] });
    const element = wrapper.find('[data-testid="rc-segmentation-bar-segment-1"]').element;

    await wrapper.setProps({ segments: [segment(4), segment(4, 'error', 'Error')] });

    expect(wrapper.find('[data-testid="rc-segmentation-bar-segment-1"]').element).toBe(element);
  });

  it.each([
    ['error', '--rc-bar-status-error'],
    ['warning', '--rc-bar-status-warning'],
    ['unknown', '--rc-bar-status-unknown'],
    ['info', '--rc-bar-status-info'],
    ['success', '--rc-bar-status-success'],
    ['critical', '--rc-bar-severity-critical'],
    ['high', '--rc-bar-severity-high'],
    ['medium', '--rc-bar-severity-medium'],
    ['low', '--rc-bar-severity-low'],
    ['none', '--rc-bar-severity-none'],
  ] as [RcSegmentColor, string][])('fills a %s segment from the %s token', (color, token) => {
    const wrapper = mountBar({ segments: [segment(1, color, color)] });

    expect(wrapper.find('.segment').attributes('style')).toContain(`--segment-color: var(${ token })`);
  });

  it('exposes the bar as an image named after its visible segments', () => {
    const wrapper = mountBar();

    expect(wrapper.attributes('role')).toBe('img');
    expect(wrapper.attributes('aria-label')).toBe('Error: 2, Warning: 5, Success: 1');
  });

  it('leaves hidden segments out of the accessible name', () => {
    const wrapper = mountBar({ segments: [...statusSegments, segment(0, 'unknown', 'Unknown')] });

    expect(wrapper.attributes('aria-label')).toBe('Error: 2, Warning: 5, Success: 1');
  });

  it('builds the accessible name from the translated segment string', () => {
    mockTranslate.mockImplementation((key: string, args: Record<string, unknown>) => `${ args.value } ${ args.label }`);
    const wrapper = mountBar({ segments: [segment(3, 'error', 'Error')] });

    expect(mockTranslate).toHaveBeenCalledWith('component.rcSegmentationBar.segment', { label: 'Error', value: 3 }, true);
    expect(wrapper.attributes('aria-label')).toBe('3 Error');
  });

  it('falls back to the default list format when the locale is not a valid language tag', () => {
    const wrapper = shallowMount(RcSegmentationBar, {
      props:  { segments: statusSegments },
      global: { provide: { store: { getters: { 'i18n/current': () => 'none' } } } },
    });

    expect(wrapper.attributes('aria-label')).toBe('Error: 2, Warning: 5, Success: 1');
  });

  it('uses the ariaLabel prop as the accessible name when it is given', () => {
    const wrapper = mountBar({ ariaLabel: 'Pod states' });

    expect(wrapper.attributes('role')).toBe('img');
    expect(wrapper.attributes('aria-label')).toBe('Pod states');
  });

  it.each([
    ['no segments', []],
    ['only zero values', [segment(0, 'error', 'Error')]],
  ] as [string, RcSegment[]][])('renders an empty bar hidden from assistive technology when there are %s', (_label, segments) => {
    const wrapper = mountBar({ segments });

    expect(wrapper.findAll('.segment:not(.empty)')).toHaveLength(0);
    expect(wrapper.attributes('role')).toBeUndefined();
    expect(wrapper.attributes('aria-label')).toBeUndefined();
    expect(wrapper.attributes('aria-hidden')).toBe('true');
  });

  it.each([
    ['no segments', [], true],
    ['only zero values', [segment(0, 'error', 'Error')], true],
    ['a positive value', [segment(0, 'error', 'Error'), segment(2, 'success', 'Success')], false],
  ] as [string, RcSegment[], boolean][])('marks the bar as empty, showing the track, when there are %s: %s', (_label, segments, empty) => {
    const wrapper = mountBar({ segments });

    expect(wrapper.classes('empty')).toBe(empty);
  });

  it('keeps an empty bar in the accessibility tree when it has an ariaLabel', () => {
    const wrapper = mountBar({ segments: [], ariaLabel: 'No vulnerabilities' });

    expect(wrapper.attributes('role')).toBe('img');
    expect(wrapper.attributes('aria-label')).toBe('No vulnerabilities');
    expect(wrapper.attributes('aria-hidden')).toBeUndefined();
  });

  it('updates the segments and accessible name when the segments change', async() => {
    const wrapper = mountBar();

    await wrapper.setProps({ segments: [segment(1, 'critical', 'Critical'), segment(3, 'low', 'Low')] });

    expect(growValues(wrapper)).toStrictEqual([25, 75]);
    expect(wrapper.find('.segment').attributes('style')).toContain('--segment-color: var(--rc-bar-severity-critical)');
    expect(wrapper.attributes('aria-label')).toBe('Critical: 1, Low: 3');
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
