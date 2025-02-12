import { SECRET, SERVICE } from '@shell/config/types';
import { SECRET_TYPES as TYPES } from '@shell/config/secret';
import { VuexStore } from '@shell/types/store/vuex';

/**
 * Helper class for common functionality shared between the detail and edit ingress pages
 *
 * This could be an untyped mixin.. but this setups up us better for the future
 */
class IngressDetailEditHelper {
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

  /**
   * Fetch services that will either be used to show
   * - Create - the possible rule's target service
   * - Edit - the selected and possible rule's target service
   * - Detail - the selected rule's target service
   */
  async fetchServices(args?: { namespace: string}): Promise<any[]> {
    return this.$store.dispatch('cluster/findAll', { type: SERVICE, opt: { namespaced: args?.namespace || this.namespace } });
  }

  /**
   * Fetch secrets that will either be used to show
   * - Create - the possible secrets to use as a certificates
   * - Edit - the selected and possible secrets to use as a certificates
   * - Detail - the selected secrets to use as certificates
   */
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

export default IngressDetailEditHelper;
