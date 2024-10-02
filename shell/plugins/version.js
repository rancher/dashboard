/**
 * Fetch version metadata from backend /rancherversion and /versionAPI and store it
 *
 * This metadata does not change for an installation of Rancher
 */

import versions from '@shell/utils/versions';

export default async function({ store }) {
  await versions.fetch({ store });
}
