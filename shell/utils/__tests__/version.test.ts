import { isDevBuild } from '@shell/utils/version';

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
