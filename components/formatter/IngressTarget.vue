<script>
import { SERVICE } from '../../config/types';
export default {
  props:
    {
      value: {
        type:     Object,
        required: true
      },
      row: {
        type:    Object,
        default: () => {
          return {};
        }
      }
    },
  data() {
    const serviceName = this.value?.rules?.[0].http?.paths[0]?.backend?.serviceName || this.value?.backend?.serviceName || '';
    const targetsWorkload = !serviceName.startsWith('ingress-');
    let name; let params;

    if (targetsWorkload) {
      name = 'c-cluster-workloads-namespace-id';
      params = { namespace: this.row?.metadata?.namespace, id: serviceName };
    } else {
      name = 'c-cluster-resource-namespace-id';
      params = {
        resource:  SERVICE,
        id:        serviceName,
        namespace: this.row?.metadata?.namespace
      };
    }

    return {
      name, params, targetsWorkload
    };
  },
  computed: {
    showHost() {
      return !!this.host;
    },
    host() {
      return this.value?.rules?.[0].host;
    },
    pathServiceName() {
      return this.value?.rules?.[0]?.http?.paths?.[0]?.backend?.serviceName;
    },
    backendServiceName() {
      return this.value?.backend?.serviceName;
    }
  }
};
</script>

<template>
  <div v-if="value">
    <div v-if="pathServiceName">
      <a v-if="showHost" rel="nofollow noopener noreferrer" target="_blank" :href="'http://' + host">{{ host }}</a>
      <i v-if="showHost" class="icon icon-chevron-right" />
      <nuxt-link :to="{name, params}">
        {{ pathServiceName }}
      </nuxt-link>
    </div>
    <div v-else-if="backendServiceName">
      <nuxt-link :to="{name, params}">
        {{ backendServiceName }}
      </nuxt-link>
    </div>
  </div>
</template>
