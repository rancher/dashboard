import { EPINIO_TYPES } from '@pkg/types';
import { sortBy } from '@shell/utils/sort';

export default {
  name: 'EpinioBindAppsMixin',

  data() {
    return { selectedApps: [] };
  },

  methods: {
    mixinFetch() {
      return this.$store.dispatch('epinio/findAll', { type: EPINIO_TYPES.APP });
    },

    async updateServiceInstances(serviceInstance) {
      // Service instance must be `deployed` before they can be bound to apps
      await this.waitForServiceInstanceDeployed(serviceInstance);

      const bindApps = this.selectedApps;
      // TODO: Blocked, see https://github.com/epinio/ui/issues/121
      // RC Edit Service Instance - unbindApps not easily discoverable at the moment.. so this fn just covers the create use case
      // const unbindApps = (this.initialValue.configuration?.boundapps || []).filter(bA => !bindApps.includes(bA));

      const promises = bindApps.map((bA) => {
        return this.value.bindApp(bA);
      });

      await Promise.all(promises);
    },

    async waitForServiceInstanceDeployed(serviceInstance) {
      // It would be nice to use waitForState here, but we need to manually update until Epinio pumps out updates via socket
      await serviceInstance.waitForTestFn(() => {
        if (this.state === 'deployed') {
          return true;
        }
        // This is an async fn, but we're in a sync fn. It might create a backlog if previous requests don't complete in time
        serviceInstance.forceFetch();
      }, `service instance state = "deployed"`, 30000, 2000).catch((err) => {
        console.warn(err); // eslint-disable-line no-console
        throw new Error('waitingForDeploy');
      });
    },

    async updateConfigurations() {
      const bindApps = this.selectedApps;
      const unbindApps = (this.initialValue.configuration?.boundapps || []).filter(bA => !bindApps.includes(bA));

      const delta = this.nsApps.reduce((res, nsA) => {
        const appName = nsA.metadata.name;
        const configName = this.value.metadata.name;

        if (bindApps.includes(appName) && !nsA.configuration.configurations.includes(configName)) {
          nsA.configuration.configurations.push(configName);
          res.push(nsA);
        } else if (unbindApps.includes(appName)) {
          const index = nsA.configuration.configurations.indexOf(configName);

          if (index >= 0) {
            nsA.configuration.configurations.splice(index, 1);
            res.push(nsA);
          }
        }

        return res;
      }, []);

      if (delta.length) {
        await Promise.all(delta.map(d => d.update()));
        await this.value.forceFetch();
      }
    }
  },

  computed: {
    allApps() {
      return sortBy(this.$store.getters['epinio/all'](EPINIO_TYPES.APP), 'meta.name');
    },

    nsApps() {
      return this.allApps.filter(a => a.meta.namespace === this.value.meta.namespace);
    },

    nsAppOptions() {
      return this.allApps
        .filter(a => a.meta.namespace === this.value.meta.namespace)
        .map(a => ({
          label: a.meta.name,
          value: a.meta.name,
        }));
    },

    noApps() {
      return this.nsAppOptions.length === 0;
    },
  },

};
