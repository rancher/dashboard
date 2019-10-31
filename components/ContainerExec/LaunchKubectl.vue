<script>
import { mapGetters } from 'vuex';
import { POD, NAMESPACE, RANCHER } from '@/config/types';

export default {
  computed:   {
    ...mapGetters('cluster', ['urlFor', 'schemaFor', 'kubeUrlFor']),

    principal() {
      return this.$store.getters['rancher/byId'](RANCHER.PRINCIPAL, this.$store.getters['auth/principalId']);
    },

    podConfig() {
      const config = {
        apiVersion: 'v1',
        kind:       'Pod',
        metadata:     { name: this.expectedPodName },
        spec:       {
          containers: [
            {
              name:            'shell',
              image:           'ubuntu:xenial',
              imagePullPolicy: 'Always',
              stdin:           true,
              tty:             true,
            }
          ]
        }
      };

      return config;
    },

    expectedPodName() {
      const regex = new RegExp(/[^a-zA-Z0-9\.-]/g);
      const userName = (this.principal.loginName || this.principal.name).toLowerCase().replace(regex, '-' );

      return `shell-${ userName }`;
    },
  },

  methods: {
    async findPod() {
      let pod;

      try {
        pod = await this.$store.dispatch('cluster/find', { type: POD, id: `default/${ this.expectedPodName }` });
        await this.$store.dispatch('cluster/watchType', { type: POD });
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
        await pod.save({ url });
        await pod.waitForCondition('Ready', 'True');
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
