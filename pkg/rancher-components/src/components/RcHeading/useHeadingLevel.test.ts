import { nextHeadingLevel, MAX_HEADING_LEVEL } from './useHeadingLevel';
import type { HeadingLevel } from './types';

describe('fx: nextHeadingLevel', () => {
  it.each([
    [1, 2],
    [2, 3],
    [5, 6],
  ])('should step h%i down to h%i', (level, expected) => {
    expect(nextHeadingLevel(level as HeadingLevel)).toStrictEqual(expected);
  });

  it('should stop at the deepest level there is a tag for', () => {
    expect(nextHeadingLevel(MAX_HEADING_LEVEL)).toStrictEqual(MAX_HEADING_LEVEL);
  });
});
