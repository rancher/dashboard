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
    const serviceName = this.value?.http?.paths[0]?.backend?.serviceName;
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
  }
};
</script>

<template>
  <div>
    <a rel="nofollow noopener noreferrer" target="_blank" :href="'http://'+value.host">{{ value.host }}</a>
    <i class="icon icon-chevron-right" />
    <nuxt-link :to="{name, params}">
      {{ value.http.paths[0].backend.serviceName }}
    </nuxt-link>
  </div>
</template>
