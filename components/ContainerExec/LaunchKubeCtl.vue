<script>
import { mapState } from 'vuex';
export default {
  computed:   {
    ...mapState('auth', ['principal']),
    podConfig() {
      const config = {
        apiVersion: 'v1',
        kind:       'Pod',
        metadata:     { name: this.expectedPodName },
        spec:       {
          containers: [
            {
              name:            'ubuntu xenial',
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
      const userName = this.principal.name.toLowerCase();
      // TODO make pod different clusters
      const cluster = 'local';

      return `manage-${ cluster }-${ userName }`;
    }
  },
  methods:    {
    findPod() {
      return fetch(`${ window.location.origin }/api/v1/namespaces/default/pods/${ this.expectedPodName }`)
        .then((res) => {
          if (res.ok) {
            return res.json();
          } else {
            throw (res);
          }
        })
        .then((json) => {
          return json;
        })
        .catch((err) => {
          console.log('error getting pod: ', err);

          return this.makePod();
        });
    },
    makePod() {
      return fetch(`${ window.location.origin }/api/v1/namespaces/default/pods`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(this.podConfig )
      }).then(res => res.json())
        .then((json) => {
          return json;
        });
    },
    deletePod() {
      fetch(`${ window.location.origin }/api/v1/namespaces/default/pods/${ this.expectedPodName }`, { method: 'DELETE' }).then(res => res.json()).then(json => console.log(json));
    },
    async openModal() {
      const resource = await this.findPod();

      console.log('opening term for: ', resource);
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

<style lang='scss' scoped>

</style>
