import { EPINIO_TYPES } from '@/products/epinio/types';

import { MANAGEMENT } from '@/config/types';
import { base64Decode } from '@/utils/crypto';
import { ingressFullPath } from '@/models/networking.k8s.io.ingress';

export default {
  async discover(store) {
    const allClusters = await store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER }, { root: true });
    const epinioClusters = [];

    for (const c of allClusters) {
      try {
        const epinioIngress = await store.dispatch(`cluster/request`, { url: `/k8s/clusters/${ c.id }/v1/networking.k8s.io.ingresses/epinio/epinio` }, { root: true });

        const url = ingressFullPath(epinioIngress, epinioIngress.spec.rules?.[0]);

        const epinioAuthData = await store.dispatch(`cluster/request`, { url: `/k8s/clusters/${ c.id }/v1/secrets/epinio/epinio-api-auth-data` }, { root: true });

        const username = epinioAuthData.data.user;
        const password = epinioAuthData.data.pass;

        epinioClusters.push({
          id:       c.spec.displayName,
          name:     c.spec.displayName,
          api:      url,
          username: base64Decode(username),
          password: base64Decode(password),
          type:     EPINIO_TYPES.INSTANCE,
        });
      } catch (err) {
        console.info(`Skipping epinio discovery for ${ c.name }`, err); // eslint-disable-line no-console
      }
    }

    // FIXME: See epinio/ui #34
    const api = process.env.epinioUrl;
    const username = process.env.epinioUser;
    const password = process.env.epinioPassword;

    if (api && username && password) {
      epinioClusters.push({
        id:   'epinio-from-env-var',
        name:     'epinio-from-env-var',
        api,
        username,
        password,
        type:     EPINIO_TYPES.INSTANCE
      });
    }

    return epinioClusters;
  }
};
