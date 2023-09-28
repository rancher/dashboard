import { isDevBuild, compare } from '@shell/utils/version';

describe('fx: compare', () => {
  it('should return null if no value is provided', () => {
    const expectation = null;

    const result = compare();

    expect(result).toStrictEqual(expectation);
  });

  describe('should return -1', () => {
    const expectation = -1;

    it('given bigger first value', () => {
      const result = compare(1, 0);

      expect(result).toStrictEqual(expectation);
    });
  });

  describe('should return 1', () => {
    const expectation = 1;

    it('given 0 to both values', () => {
      const result = compare(0, 0);

      expect(result).toStrictEqual(expectation);
    });

    it('given bigger second value', () => {
      const result = compare(0, 1);

      expect(result).toStrictEqual(expectation);
    });
  });
});

describe('fx: isDevBuild', () => {
  it.each([
    'dev',
    'master',
    'head',
    'whatever-head',
    'whatever-rc1',
    'whatever-alpha1',
  ])(
    'should exclude version type %p', (version: string) => {
      const result = isDevBuild(version);

      expect(result).toBe(true);
    }
  );
});
