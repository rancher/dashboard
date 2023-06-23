import { generateSupportLink } from '@shell/utils/version';

describe('fx: generateSupportLink', () => {
  it('should generate support link corresponding to the installed Rancher version', () => {
    const version = 'v2.7.5';
    const expectation = 'https://www.suse.com/suse-rancher/support-matrix/all-supported-versions/rancher-v2-7-5';

    const result = generateSupportLink(version);

    expect(result).toStrictEqual(expectation);
  });

  const latestVersionSupportURL = 'https://rancher.com/support-maintenance-terms';
  const testCases = [
    ['v2.7-0bcf068e1237acafd4aca01385c7c6b432e22fd7-head', latestVersionSupportURL],
    ['v2.7.5-rc4', latestVersionSupportURL],
    [undefined, latestVersionSupportURL],
  ];

  it.each(testCases)(
    'should generate support link corresponding to the latest Rancher version when version is unknown or for dev build',
    (version, expected) => {
      const result = generateSupportLink(version);

      expect(result).toBe(expected);
    }
  );
});
