import { requireAsset, requireJson } from '@shell/utils/require-asset';

describe('fx: requireAsset with the shell assets', () => {
  it('should find a shell image', () => {
    expect(requireAsset('~shell/assets/images/providers/aws.svg')).toBeDefined();
  });

  it('should find shell json', () => {
    expect(requireJson('~shell/assets/brand/suse/metadata.json')).toStrictEqual(expect.any(Object));
  });

  it('should throw for an asset the shell does not have', () => {
    expect(() => requireAsset('~shell/assets/images/does-not-exist.svg')).toThrow('Cannot find module');
  });
});
