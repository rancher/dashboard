import { generateSupportLink } from '@shell/utils/version';

describe('fx: generateSupportLink', () => {
  it('should generate support link corresponding to the installed Rancher version', () => {
    const version = 'v2.7.5';
    const expectation = 'https://www.suse.com/suse-rancher/support-matrix/all-supported-versions/rancher-v2-7-5';

    const result = generateSupportLink(version);

    expect(result).toStrictEqual(expectation);
  });

  it('should generate support link corresponding to the latest Rancher version', () => {
    const expectation = 'https://rancher.com/support-maintenance-terms';
    const version1 = 'v2.7-0bcf068e1237acafd4aca01385c7c6b432e22fd7-head';
    const result1 = generateSupportLink(version1);

    expect(result1).toStrictEqual(expectation);

    const version2 = 'v2.7.5-rc4';
    const result2 = generateSupportLink(version2);

    expect(result2).toStrictEqual(expectation);
  });
});
