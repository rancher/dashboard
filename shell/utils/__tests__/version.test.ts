import { isDevBuild, isUpgradeFromPreToStable } from '@shell/utils/version';

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

describe('fx: isUpgradeFromPreToStable', () => {
  it('should be true when going from pre-release to stable of same version', () => {
    expect(isUpgradeFromPreToStable('1.0.0-rc1', '1.0.0')).toBe(true);
  });

  it('should be false when going from stable to pre-release', () => {
    expect(isUpgradeFromPreToStable('1.0.0', '1.0.0-rc1')).toBe(false );
  });

  it('should be false for stable to stable', () => {
    expect(isUpgradeFromPreToStable('1.0.0', '1.1.0')).toBe(false);
  });

  it('should be false for pre-release to pre-release', () => {
    expect(isUpgradeFromPreToStable('1.0.0-rc1', '1.0.0-rc2')).toBe(false);
  });
});
