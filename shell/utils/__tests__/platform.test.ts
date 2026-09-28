import {
  alternateKey,
  isAlternate,
  isMore,
  isRange,
  moreKey,
  rangeKey,
  suppressContextMenu,
  version,
} from '@shell/utils/platform';

describe('platform utils', () => {
  describe('isAlternate', () => {
    it.each([
      {
        desc:     'returns true when the alternate key is pressed',
        event:    { [alternateKey]: true },
        expected: true,
      },
      {
        desc:     'returns false when the alternate key is not pressed',
        event:    { [alternateKey]: false },
        expected: false,
      },
    ])('$desc', ({ event, expected }) => {
      expect(isAlternate(event)).toStrictEqual(expected);
    });
  });

  describe('isMore', () => {
    it.each([
      {
        desc:     'returns true when the more key is pressed',
        event:    { [moreKey]: true },
        expected: true,
      },
      {
        desc:     'returns false when the more key is not pressed',
        event:    { [moreKey]: false },
        expected: false,
      },
    ])('$desc', ({ event, expected }) => {
      expect(isMore(event)).toStrictEqual(expected);
    });
  });

  describe('isRange', () => {
    it.each([
      {
        desc:     'returns true when the range key (shift) is pressed',
        event:    { [rangeKey]: true },
        expected: true,
      },
      {
        desc:     'returns false when the range key is not pressed',
        event:    { [rangeKey]: false },
        expected: false,
      },
    ])('$desc', ({ event, expected }) => {
      expect(isRange(event)).toStrictEqual(expected);
    });
  });

  describe('suppressContextMenu', () => {
    it.each([
      {
        desc:     'returns true when ctrlKey is pressed and mouse button is 2',
        event:    { ctrlKey: true, button: 2 },
        expected: true,
      },
      {
        desc:     'returns false when ctrlKey is not pressed',
        event:    { ctrlKey: false, button: 2 },
        expected: false,
      },
      {
        desc:     'returns false when mouse button is not 2',
        event:    { ctrlKey: true, button: 0 },
        expected: false,
      },
    ])('$desc', ({ event, expected }) => {
      expect(suppressContextMenu(event)).toStrictEqual(expected);
    });
  });

  describe('version', () => {
    it('returns null when userAgent does not contain a Version/ segment', () => {
      expect(version()).toBeNull();
    });
  });
});
