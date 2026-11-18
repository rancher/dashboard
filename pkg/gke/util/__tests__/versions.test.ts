import { getAllKubernetesVersions } from '../versions';
import type { getGKEVersionsResponse } from '@shell/components/google/types/gcp.d.ts';

describe('getAllKubernetesVersions', () => {
  it('gathers versions from all channels', () => {
    const versionsResponse: getGKEVersionsResponse = {
      channels: [
        {
          channel:        'REGULAR',
          defaultVersion: '1.35.6-gke.1710000',
          validVersions:  ['1.36.2-gke.2064000', '1.35.7-gke.1027000', '1.35.6-gke.1710000']
        },
        {
          channel:        'RAPID',
          defaultVersion: '1.36.3-gke.1537000',
          validVersions:  ['1.36.3-gke.1640000', '1.36.3-gke.1537000', '1.35.7-gke.1222000']
        }
      ],
      validMasterVersions:   ['1.34.10-gke.1079000'],
      defaultClusterVersion: '1.35.6-gke.1710000',
      defaultImageType:      'COS_CONTAINERD',
      validImageTypes:       ['COS_CONTAINERD', 'COS'],
      validNodeVersions:     ['1.36.3-gke.1640000', '1.35.6-gke.1710000']
    };

    const result = getAllKubernetesVersions(versionsResponse);

    expect(result).toContain('1.36.2-gke.2064000');
    expect(result).toContain('1.35.7-gke.1027000');
    expect(result).toContain('1.36.3-gke.1640000');
    // Should NOT include validMasterVersions
    expect(result).not.toContain('1.34.10-gke.1079000');
  });

  it('removes duplicate versions across channels', () => {
    const versionsResponse: getGKEVersionsResponse = {
      channels: [
        {
          channel:        'REGULAR',
          defaultVersion: '1.35.6-gke.1710000',
          validVersions:  ['1.36.2-gke.2064000', '1.35.7-gke.1027000']
        },
        {
          channel:        'RAPID',
          defaultVersion: '1.36.3-gke.1537000',
          validVersions:  ['1.36.2-gke.2064000', '1.35.7-gke.1027000']
        }
      ],
      validMasterVersions:   ['1.36.2-gke.2064000'],
      defaultClusterVersion: '1.36.2-gke.2064000',
      defaultImageType:      'COS_CONTAINERD',
      validImageTypes:       ['COS_CONTAINERD'],
      validNodeVersions:     ['1.36.2-gke.2064000']
    };

    const result = getAllKubernetesVersions(versionsResponse);

    // Count occurrences of the duplicate version
    const count = result.filter((v) => v === '1.36.2-gke.2064000').length;

    expect(count).toBe(1);
  });

  it('sorts versions from highest to lowest', () => {
    const versionsResponse: getGKEVersionsResponse = {
      channels: [
        {
          channel:        'STABLE',
          defaultVersion: '1.34.9-gke.1322001',
          validVersions:  ['1.34.9-gke.1322001', '1.33.13-gke.1329000', '1.36.3-gke.1640000', '1.35.7-gke.1222000']
        }
      ],
      validMasterVersions:   [],
      defaultClusterVersion: '1.36.3-gke.1640000',
      defaultImageType:      'COS_CONTAINERD',
      validImageTypes:       ['COS_CONTAINERD'],
      validNodeVersions:     ['1.36.3-gke.1640000']
    };

    const result = getAllKubernetesVersions(versionsResponse);

    // Verify the first element is higher than the last
    expect(result[0]).toBe('1.36.3-gke.1640000');
    expect(result[result.length - 1]).toBe('1.33.13-gke.1329000');
  });

  it('returns empty array when no channels are provided', () => {
    const versionsResponse: getGKEVersionsResponse = {
      channels:              [],
      validMasterVersions:   ['1.36.3-gke.1640000', '1.35.7-gke.1222000'],
      defaultClusterVersion: '1.36.3-gke.1640000',
      defaultImageType:      'COS_CONTAINERD',
      validImageTypes:       ['COS_CONTAINERD'],
      validNodeVersions:     ['1.36.3-gke.1640000']
    };

    const result = getAllKubernetesVersions(versionsResponse);

    expect(result).toStrictEqual([]);
  });

  it('ignores validMasterVersions and only uses channel versions', () => {
    const versionsResponse: getGKEVersionsResponse = {
      channels: [
        {
          channel:        'STABLE',
          defaultVersion: '1.35.6-gke.1250000',
          validVersions:  ['1.35.6-gke.1250000', '1.34.9-gke.1322001']
        }
      ],
      validMasterVersions:   ['1.36.3-gke.1640000', '1.35.7-gke.1222000', '1.33.0-gke.1000000'],
      defaultClusterVersion: '1.35.6-gke.1250000',
      defaultImageType:      'COS_CONTAINERD',
      validImageTypes:       ['COS_CONTAINERD'],
      validNodeVersions:     ['1.35.6-gke.1250000']
    };

    const result = getAllKubernetesVersions(versionsResponse);

    // Should only contain channel versions
    expect(result).toContain('1.35.6-gke.1250000');
    expect(result).toContain('1.34.9-gke.1322001');
    // Should NOT contain any validMasterVersions
    expect(result).not.toContain('1.36.3-gke.1640000');
    expect(result).not.toContain('1.35.7-gke.1222000');
    expect(result).not.toContain('1.33.0-gke.1000000');
  });

  it('returns empty array when response is empty', () => {
    const versionsResponse: getGKEVersionsResponse = {
      channels:              [],
      validMasterVersions:   [],
      defaultClusterVersion: '',
      defaultImageType:      '',
      validImageTypes:       [],
      validNodeVersions:     []
    };

    const result = getAllKubernetesVersions(versionsResponse);

    expect(result).toStrictEqual([]);
  });

  it('handles channels with empty validVersions arrays', () => {
    const versionsResponse: getGKEVersionsResponse = {
      channels: [
        {
          channel:        'STABLE',
          defaultVersion: '',
          validVersions:  []
        }
      ],
      validMasterVersions:   ['1.36.3-gke.1640000'],
      defaultClusterVersion: '1.36.3-gke.1640000',
      defaultImageType:      'COS_CONTAINERD',
      validImageTypes:       ['COS_CONTAINERD'],
      validNodeVersions:     ['1.36.3-gke.1640000']
    };

    const result = getAllKubernetesVersions(versionsResponse);

    expect(result).toStrictEqual([]);
  });

  it('correctly sorts mixed major/minor versions', () => {
    const versionsResponse: getGKEVersionsResponse = {
      channels: [
        {
          channel:        'STABLE',
          defaultVersion: '1.35.6-gke.1250000',
          validVersions:  ['1.30.14-gke.2866000', '1.35.6-gke.1250000', '1.34.9-gke.1322001', '1.32.13-gke.2314000']
        }
      ],
      validMasterVersions:   [],
      defaultClusterVersion: '1.35.6-gke.1250000',
      defaultImageType:      'COS_CONTAINERD',
      validImageTypes:       ['COS_CONTAINERD'],
      validNodeVersions:     ['1.35.6-gke.1250000']
    };

    const result = getAllKubernetesVersions(versionsResponse);

    // Check that 1.35.x is before 1.34.x is before 1.32.x is before 1.30.x
    const index35 = result.findIndex((v) => v.startsWith('1.35'));
    const index34 = result.findIndex((v) => v.startsWith('1.34'));
    const index32 = result.findIndex((v) => v.startsWith('1.32'));
    const index30 = result.findIndex((v) => v.startsWith('1.30'));

    expect(index35).toBeLessThan(index34);
    expect(index34).toBeLessThan(index32);
    expect(index32).toBeLessThan(index30);
  });

  it('preserves all unique versions from all channels', () => {
    const versionsResponse: getGKEVersionsResponse = {
      channels: [
        {
          channel:        'REGULAR',
          defaultVersion: '1.35.6-gke.1710000',
          validVersions:  ['1.36.2-gke.2064000', '1.35.7-gke.1027000']
        },
        {
          channel:        'RAPID',
          defaultVersion: '1.36.3-gke.1537000',
          validVersions:  ['1.36.3-gke.1640000', '1.35.7-gke.1222000']
        },
        {
          channel:        'STABLE',
          defaultVersion: '1.35.6-gke.1710000',
          validVersions:  ['1.34.10-gke.1079000', '1.34.9-gke.1655001']
        }
      ],
      validMasterVersions:   [],
      defaultClusterVersion: '1.36.3-gke.1640000',
      defaultImageType:      'COS_CONTAINERD',
      validImageTypes:       ['COS_CONTAINERD'],
      validNodeVersions:     ['1.36.3-gke.1640000']
    };

    const result = getAllKubernetesVersions(versionsResponse);

    expect(result).toContain('1.36.2-gke.2064000');
    expect(result).toContain('1.35.7-gke.1027000');
    expect(result).toContain('1.36.3-gke.1640000');
    expect(result).toContain('1.35.7-gke.1222000');
    expect(result).toContain('1.34.10-gke.1079000');
    expect(result).toContain('1.34.9-gke.1655001');
  });

  it('handles patch version sorting within same minor version', () => {
    const versionsResponse: getGKEVersionsResponse = {
      channels: [
        {
          channel:        'STABLE',
          defaultVersion: '1.35.6-gke.1250000',
          validVersions:  ['1.35.6-gke.1250000', '1.35.7-gke.1027000', '1.35.5-gke.1233001']
        }
      ],
      validMasterVersions:   [],
      defaultClusterVersion: '1.35.6-gke.1250000',
      defaultImageType:      'COS_CONTAINERD',
      validImageTypes:       ['COS_CONTAINERD'],
      validNodeVersions:     ['1.35.6-gke.1250000']
    };

    const result = getAllKubernetesVersions(versionsResponse);

    // Find indices of the 1.35.x versions
    const index6 = result.findIndex((v) => v === '1.35.6-gke.1250000');
    const index7 = result.findIndex((v) => v === '1.35.7-gke.1027000');
    const index5 = result.findIndex((v) => v === '1.35.5-gke.1233001');

    // 1.35.7 should come before 1.35.6, which should come before 1.35.5
    expect(index7).toBeLessThan(index6);
    expect(index6).toBeLessThan(index5);
  });
});
