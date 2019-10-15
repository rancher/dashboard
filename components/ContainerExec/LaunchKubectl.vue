<script>
import { mapState, mapGetters } from 'vuex';
import { POD, NAMESPACE } from '@/config/types';

export default {
  computed:   {
    ...mapState('auth', ['principal']),
    ...mapGetters('cluster', ['urlFor', 'schemaFor', 'kubeUrlFor']),
    podConfig() {
      const config = {
        apiVersion: 'v1',
        kind:       'Pod',
        metadata:     { name: this.expectedPodName },
        spec:       {
          containers: [
            {
              name:            'ubuntu-xenial',
              image:           'ubuntu:xenial',
              imagePullPolicy: 'Always',
              stdin:           true
            }
          ]
        }
      };

      return config;
    },
    expectedPodName() {
      const regex = new RegExp(/[^a-zA-Z0-9\.-]/g);
      const userName = this.principal.name.toLowerCase().replace(regex, '-' );
      // TODO make pod different clusters
      const cluster = 'local';

      return `manage-${ cluster }-${ userName }`;
    },
  },
  methods:    {
    async findPod() {
      let pod;

      try {
        pod = await this.$store.dispatch('cluster/find', { type: POD, id: `default/${ this.expectedPodName }` });
      } catch (err) {
        pod = await this.makePod();
      }

      return pod;
    },
    async makePod() {
      let pod;
      const ns = await this.$store.dispatch('cluster/find', { type: NAMESPACE, id: 'default' });

      const url = `${ ns.links.view }/pods`;

      try {
        pod = await this.$store.dispatch('cluster/create', this.podConfig);
        pod.save({ url });
      } catch (err) {
        console.error(err);
      } finally {
        // eslint-disable-next-line no-unsafe-finally
        return this.findPod();
      }
    },
    async openModal() {
      const resource = await this.findPod();

      this.$store.dispatch('shell/defineSocket', { resource, action: 'openShell' });
    }
  }
};

</script>

<template>
  <button class="btn-sm bg-secondary" @click="openModal">
    ≥ kubectl
  </button>
</template>
