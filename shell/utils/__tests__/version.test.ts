import { isDevBuild, getReleaseNotesURL } from '@shell/utils/version';

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

describe('fx: getReleaseNotesURL', () => {
  describe('when version is not provided', () => {
    it('should return the community dev URL', () => {
      expect(getReleaseNotesURL(false, undefined)).toBe('https://github.com/rancher/rancher/releases/latest');
      expect(getReleaseNotesURL(false, '')).toBe('https://github.com/rancher/rancher/releases/latest');
      expect(getReleaseNotesURL(true, undefined)).toBe('https://github.com/rancher/rancher/releases/latest');
    });
  });

  describe('community (non-prime) URLs', () => {
    it('should return dev URL for dev builds', () => {
      expect(getReleaseNotesURL(false, 'dev')).toBe('https://github.com/rancher/rancher/releases/latest');
      expect(getReleaseNotesURL(false, 'master')).toBe('https://github.com/rancher/rancher/releases/latest');
      expect(getReleaseNotesURL(false, 'head')).toBe('https://github.com/rancher/rancher/releases/latest');
      expect(getReleaseNotesURL(false, '2.8.0-head')).toBe('https://github.com/rancher/rancher/releases/latest');
      expect(getReleaseNotesURL(false, '2.8.0-rc1')).toBe('https://github.com/rancher/rancher/releases/latest');
      expect(getReleaseNotesURL(false, '2.8.0-alpha1')).toBe('https://github.com/rancher/rancher/releases/latest');
    });

    it('should return release URL with version for stable releases', () => {
      expect(getReleaseNotesURL(false, '2.8.0')).toBe('https://github.com/rancher/rancher/releases/tag/v2.8.0');
      expect(getReleaseNotesURL(false, '2.8.1')).toBe('https://github.com/rancher/rancher/releases/tag/v2.8.1');
      expect(getReleaseNotesURL(false, '2.10.3')).toBe('https://github.com/rancher/rancher/releases/tag/v2.10.3');
    });

    it('should handle version with v prefix', () => {
      expect(getReleaseNotesURL(false, 'v2.8.0')).toBe('https://github.com/rancher/rancher/releases/tag/v2.8.0');
      expect(getReleaseNotesURL(false, 'v2.10.3')).toBe('https://github.com/rancher/rancher/releases/tag/v2.10.3');
    });
  });

  describe('prime URLs', () => {
    it('should return dev URL for dev builds', () => {
      expect(getReleaseNotesURL(true, 'dev')).toBe('https://documentation.suse.com/cloudnative/rancher-manager/latest/en/release-notes.html');
      expect(getReleaseNotesURL(true, 'master')).toBe('https://documentation.suse.com/cloudnative/rancher-manager/latest/en/release-notes.html');
      expect(getReleaseNotesURL(true, 'head')).toBe('https://documentation.suse.com/cloudnative/rancher-manager/latest/en/release-notes.html');
      expect(getReleaseNotesURL(true, '2.8.0-head')).toBe('https://documentation.suse.com/cloudnative/rancher-manager/latest/en/release-notes.html');
      expect(getReleaseNotesURL(true, '2.8.0-rc1')).toBe('https://documentation.suse.com/cloudnative/rancher-manager/latest/en/release-notes.html');
      expect(getReleaseNotesURL(true, '2.8.0-alpha1')).toBe('https://documentation.suse.com/cloudnative/rancher-manager/latest/en/release-notes.html');
    });

    it('should return release URL with version and major.minor for stable releases', () => {
      expect(getReleaseNotesURL(true, '2.8.0')).toBe('https://documentation.suse.com/cloudnative/rancher-manager/v2.8/en/release-notes/v2.8.0.html');
      expect(getReleaseNotesURL(true, '2.8.1')).toBe('https://documentation.suse.com/cloudnative/rancher-manager/v2.8/en/release-notes/v2.8.1.html');
      expect(getReleaseNotesURL(true, '2.10.3')).toBe('https://documentation.suse.com/cloudnative/rancher-manager/v2.10/en/release-notes/v2.10.3.html');
    });

    it('should handle version with v prefix', () => {
      expect(getReleaseNotesURL(true, 'v2.8.0')).toBe('https://documentation.suse.com/cloudnative/rancher-manager/v2.8/en/release-notes/v2.8.0.html');
      expect(getReleaseNotesURL(true, 'v2.10.3')).toBe('https://documentation.suse.com/cloudnative/rancher-manager/v2.10/en/release-notes/v2.10.3.html');
    });
  });
});
