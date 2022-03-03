import SteveModel from '@/plugins/steve/steve-class';
import { KUBEWARDEN } from '@/config/types';
import { proxyUrlFromParts } from '@/models/service';

export default class ClusterAdmissionPolicy extends SteveModel {
  get allPolicies() {
    return async() => {
      try {
        return await this.$store.dispatch('cluster/findAll', { type: KUBEWARDEN.CLUSTER_ADMISSION_POLICY }, { root: true });
      } catch (e) {
        console.error(`Error fetching policies: ${ e }`); // eslint-disable-line no-console
      }
    };
  }

  get link() {
    if ( this.spec?.toURL ) {
      return this.spec.toURL;
    } else if ( this.spec?.toService ) {
      const s = this.spec.toService;

      return proxyUrlFromParts(this.$rootGetters['clusterId'], s.namespace, s.name, s.scheme, s.port, s.path);
    } else {
      return null;
    }
  }

  async tracesList() {
    const url = `/k8s/clusters/${ this.currentCluster }/api/v1/namespaces/jaeger/services/http:all-in-one-query:16686/proxy/api/traces?operation=/api/traces&service=jaeger-query`;

    try {
      const inStore = this.$store.getters['currentProduct'].inStore;

      return await this.$store.dispatch(`${ inStore }/request`, { url });
    } catch (e) {
      console.error('Error fetching traces', e); // eslint-disable-line no-console

      return e;
    }
  }
}
