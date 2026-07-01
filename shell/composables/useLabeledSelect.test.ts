import { computed, nextTick, ref } from 'vue';

import { useLabeledSelect } from './useLabeledSelect';
import * as widthUtils from '@shell/utils/width';

jest.mock('@shell/utils/width', () => ({
  getWidth: jest.fn(),
  setWidth: jest.fn(),
}));

describe('useLabeledSelect', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isSearchable', () => {
    it.each([
      {
        desc:        'canPaginate is true',
        props:       { options: [] as any[] },
        canPaginate: true,
        expected:    true,
      },
      {
        desc:        '10 or more options',
        props:       { options: new Array(10).fill({}) },
        canPaginate: false,
        expected:    true,
      },
      {
        desc:        'searchable prop is true',
        props:       { options: [] as any[], searchable: true },
        canPaginate: false,
        expected:    true,
      },
      {
        desc:        'fewer than 10 options and not searchable',
        props:       { options: new Array(9).fill({}) },
        canPaginate: false,
        expected:    false,
      },
      {
        desc:        'no options provided',
        props:       {},
        canPaginate: false,
        expected:    false,
      },
    ])('returns $expected when $desc', ({ props, canPaginate, expected }) => {
      const canPaginateRef = computed(() => canPaginate);
      const { isSearchable } = useLabeledSelect(props, canPaginateRef);

      expect(isSearchable.value).toStrictEqual(expected);
    });

    it('returns true when options length is exactly 10', () => {
      const { isSearchable } = useLabeledSelect({ options: new Array(10).fill({}) });

      expect(isSearchable.value).toStrictEqual(true);
    });

    it('returns false when options length is 9', () => {
      const { isSearchable } = useLabeledSelect({ options: new Array(9).fill({}) });

      expect(isSearchable.value).toStrictEqual(false);
    });
  });

  describe('isFilterable', () => {
    it.each([
      {
        desc:        'canPaginate is true',
        props:       { filterable: true },
        canPaginate: true,
        expected:    false,
      },
      {
        desc:        'filterable is explicitly false',
        props:       { filterable: false },
        canPaginate: false,
        expected:    false,
      },
      {
        desc:        'filterable is explicitly true',
        props:       { filterable: true },
        canPaginate: false,
        expected:    true,
      },
      {
        desc:        'filterable is not set (defaults to true)',
        props:       {},
        canPaginate: false,
        expected:    true,
      },
    ])('returns $expected when $desc', ({ props, canPaginate, expected }) => {
      const canPaginateRef = computed(() => canPaginate);
      const { isFilterable } = useLabeledSelect(props, canPaginateRef);

      expect(isFilterable.value).toStrictEqual(expected);
    });
  });

  describe('resizeHandler', () => {
    it('calls setWidth when dropdown is narrower than select input', async() => {
      const selectEl = document.createElement('div');
      const ddEl = document.createElement('ul');
      const selectRef = ref<HTMLElement | null>(selectEl);

      jest.spyOn(selectEl, 'querySelector').mockReturnValue(ddEl);
      (widthUtils.getWidth as jest.Mock).mockImplementation((el: Element) => (el === selectEl ? 200 : 100));

      const { resizeHandler } = useLabeledSelect({});

      resizeHandler(selectRef as any);
      await nextTick();

      expect(widthUtils.setWidth).toHaveBeenCalledWith(ddEl, 200);
    });

    it('does not call setWidth when dropdown is wider than select input', async() => {
      const selectEl = document.createElement('div');
      const ddEl = document.createElement('ul');
      const selectRef = ref<HTMLElement | null>(selectEl);

      jest.spyOn(selectEl, 'querySelector').mockReturnValue(ddEl);
      (widthUtils.getWidth as jest.Mock).mockImplementation((el: Element) => (el === selectEl ? 100 : 200));

      const { resizeHandler } = useLabeledSelect({});

      resizeHandler(selectRef as any);
      await nextTick();

      expect(widthUtils.setWidth).not.toHaveBeenCalled();
    });

    it('does not call setWidth when dropdown and select have equal width', async() => {
      const selectEl = document.createElement('div');
      const ddEl = document.createElement('ul');
      const selectRef = ref<HTMLElement | null>(selectEl);

      jest.spyOn(selectEl, 'querySelector').mockReturnValue(ddEl);
      (widthUtils.getWidth as jest.Mock).mockReturnValue(150);

      const { resizeHandler } = useLabeledSelect({});

      resizeHandler(selectRef as any);
      await nextTick();

      expect(widthUtils.setWidth).not.toHaveBeenCalled();
    });

    it('does nothing when selectRef.value is null', async() => {
      const selectRef = ref<HTMLElement | null>(null);
      const { resizeHandler } = useLabeledSelect({});

      resizeHandler(selectRef as any);
      await nextTick();

      expect(widthUtils.getWidth).not.toHaveBeenCalled();
      expect(widthUtils.setWidth).not.toHaveBeenCalled();
    });
  });

  it('returns expected shape', () => {
    const { isSearchable, isFilterable, resizeHandler } = useLabeledSelect({});

    expect(typeof isSearchable.value).toBe('boolean');
    expect(typeof isFilterable.value).toBe('boolean');
    expect(typeof resizeHandler).toBe('function');
  });
});
