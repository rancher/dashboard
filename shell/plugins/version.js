/**
 * Fetch version metadata from backend /rancherversion API and store it
 *
 * This metadata does not change for an installation of Rancher
 */

import { setVersionData } from '@shell/config/version';

export default async function({ store }) {
  try {
    const response = await store.dispatch('rancher/request', {
      url:                  '/rancherversion',
      method:               'get',
      redirectUnauthorized: false
    });

    setVersionData(response);
  } catch (e) {
    console.warn('Failed to fetch Rancher version metadata', e); // eslint-disable-line no-console
  }
}
