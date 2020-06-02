<script>
import { WORKLOAD_TYPES, SERVICE } from '@/config/types';

export default {
  props:  {
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

  async fetch() {
    await Promise.all(Object.values(WORKLOAD_TYPES).map(type => this.$store.dispatch('cluster/findAll', { type })));
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
    workloads() {
      return Object.values(WORKLOAD_TYPES).flatMap(type => this.$store.getters['cluster/all'](type));
    },
    showHost() {
      return !!this.host;
    },
    host() {
      return this.value?.rules?.[0].host;
    },
    pathServiceName() {
      return this.value?.rules?.[0]?.http?.paths?.[0]?.backend?.serviceName;
    },
    namespace() {
      return this.row?.metadata?.namespace;
    },
    paths() {
      const rules = this.value.rules || [];

      return rules.flatMap((rule) => {
        const paths = rule?.http?.paths || [];

        return paths.map(path => ({
          url:             `${ rule.host }${ path.path }`,
          serviceName:     path?.backend?.serviceName,
          serviceTargetTo: path?.backend?.serviceName ? this.targetTo(path.backend.serviceName) : null
        }));
      });
    },
    defaultServiceName() {
      return this.value?.backend?.serviceName;
    },
    defaultServiceTargetTo() {
      return this.targetTo(this.defaultServiceName);
    }
  },
  methods: {
    targetTo(serviceName) {
      const isTargetsWorkload = !serviceName.startsWith('ingress-');
      const id = `${ this.namespace }/${ serviceName }`;

      return isTargetsWorkload
        ? this.findWorkload(id)?.detailLocation || ''
        : {
          resource:  SERVICE,
          id:        serviceName,
          namespace: this.namespace
        };
    },

    findWorkload(id) {
      return this.workloads.find(w => w.id === (id));
    },
  }
};
</script>

<template>
  <div v-if="!loading &&value" class="ingress-target" :reactivity="workloads.length">
    <div v-for="(path, i) in paths" :key="i" class="target">
      <a rel="nofollow noopener noreferrer" target="_blank" :href="`https://${path.url}`">{{ path.url }}</a>
      <i class="icon icon-chevron-right" />
      <nuxt-link v-if="path.serviceName && path.serviceTargetTo" :to="path.serviceTargetTo">
        {{ path.serviceName }}
      </nuxt-link>
      <span v-else-if="path.serviceName">
        {{ path.serviceName }}
      </span>
    </div>
    <div v-if="defaultServiceName" class="target">
      <nuxt-link v-if="targetTo(defaultServiceName)" :to="targetTo(defaultServiceName)">
        {{ defaultServiceName }}
      </nuxt-link>
      <span v-else>
        {{ defaultServiceName }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ingress-target {
  padding: 15px;

  .target:not(:last-child) {
    margin-bottom: 5px;
  }
}
</style>
