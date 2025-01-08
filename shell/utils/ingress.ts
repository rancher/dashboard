import { SECRET, SERVICE } from '@shell/config/types';
import { SECRET_TYPES as TYPES } from '@shell/config/secret';
import { VuexStore } from '@shell/types/store/vuex';

class IngressHelper {
  private $store: VuexStore;
  private namespace: string;

  constructor({
    $store,
    namespace,
  }: {
    $store: VuexStore
    namespace: string,
  }) {
    this.$store = $store;
    this.namespace = namespace;
  }

  async fetchServices(args?: { namespace: string}): Promise<any[]> {
    return this.$store.dispatch('cluster/findAll', { type: SERVICE, opt: { namespaced: args?.namespace || this.namespace } });
  }

  async fetchSecrets(args?: { namespace: string}): Promise<any[]> {
    return this.$store.dispatch('cluster/findAll', { type: SECRET, opt: { namespaced: args?.namespace || this.namespace } });
  }

  findAndMapCerts(secrets: any[]) {
    return secrets
      .filter((secret) => secret._type === TYPES.TLS)
      .map((secret) => {
        const { id } = secret;

        return id.slice(id.indexOf('/') + 1);
      });
  }

  findAndMapServiceTargets(services: any[]) {
    return services.map((service) => ({
      label: service.metadata.name,
      value: service.metadata.name,
      ports: service.spec.ports?.map((p: any) => p.port)
    }));
  }
}

export default IngressHelper;
