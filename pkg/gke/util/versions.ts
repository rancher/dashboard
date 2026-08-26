import { sortable } from '@shell/utils/version';
import { sortBy } from '@shell/utils/sort';
import type { getGKEVersionsResponse } from '@shell/components/google/types/gcp.d.ts';

export const getAllKubernetesVersions = (versionsResponse: getGKEVersionsResponse): string[] => {
  const versions = new Set<string>();

  // Add versions from all channels
  (versionsResponse?.channels || []).forEach((channel) => {
    (channel.validVersions || []).forEach((version) => {
      versions.add(version);
    });
  });

  // Convert to array with sort properties and sort highest to lowest
  const versionObjects = Array.from(versions).map((v) => ({
    value: v,
    sort:  sortable(v)
  }));

  const sorted = sortBy(versionObjects, 'sort', true);

  return sorted.map((v) => v.value);
};
