import { EPINIO_TYPES } from '../types';

import { MANAGEMENT } from '@shell/config/types';
import { base64Decode } from '@shell/utils/crypto';
import { ingressFullPath } from '@shell/models/networking.k8s.io.ingress';
import { allHash } from '@shell/utils/promise';

export default {
  async discover(store: any) {
    const allClusters = await store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER }, { root: true });
    const epinioClusters = [];

    for (const c of allClusters.filter((c: any) => c.isReady)) {
      try {
        // Get the url first, if it has this it's highly likely it's an epinio cluster
        const epinioIngress = await store.dispatch(`cluster/request`, { url: `/k8s/clusters/${ c.id }/v1/networking.k8s.io.ingresses/epinio/epinio` }, { root: true });
        const url = ingressFullPath(epinioIngress, epinioIngress.spec.rules?.[0]);

        const epinio: any = await allHash({ authData: store.dispatch(`cluster/request`, { url: `/k8s/clusters/${ c.id }/v1/secrets/epinio/default-epinio-user` }, { root: true }) });

        const username = epinio.authData.data.username;
        const password = epinio.authData.data.password;

        epinioClusters.push({
          id:          c.id,
          name:        c.spec.displayName,
          api:         url,
          readyApi:    `${ url }/ready`,
          username:    base64Decode(username),
          password:    base64Decode(password),
          type:        EPINIO_TYPES.INSTANCE,
          mgmtCluster: c
        });
      } catch (err) {
        console.info(`Skipping epinio discovery for ${ c.spec.displayName }`, err); // eslint-disable-line no-console
      }
    }

    return epinioClusters;
  }
};
