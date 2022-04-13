<script>
import { WORKLOAD_TYPES } from '@shell/config/types';
import IngressFullPath from '@shell/components/formatter/IngressFullPath';

export default {
  components: { IngressFullPath },
  props:      {
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

  computed: {
    workloads() {
      return Object.values(WORKLOAD_TYPES).flatMap(type => this.$store.getters['cluster/all'](type));
    },
    paths() {
      return this.row.createRulesForListPage(this.workloads);
    },
    defaultService() {
      return this.row.createDefaultService(this.workloads);
    }
  }
};
</script>

<template>
  <div v-if="value" class="ingress-target" :reactivity="workloads.length">
    <div v-for="(path, i) in paths" :key="i" class="target">
      <IngressFullPath :row="path" />
      <i class="icon icon-chevron-right" />
      <nuxt-link v-if="path.serviceName && path.serviceTargetTo" :to="path.serviceTargetTo">
        {{ path.serviceName }}
      </nuxt-link>
      <span v-else-if="path.serviceName">
        {{ path.serviceName }}
      </span>
    </div>
    <div v-if="defaultService" class="target">
      {{ t('ingress.target.default') }} <i class="icon icon-chevron-right" />
      <nuxt-link v-if="defaultService.targetTo" :to="defaultService.targetTo">
        {{ defaultService.name }}
      </nuxt-link>
      <span v-else>
        {{ defaultService.name }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ingress-target {
  .target:not(:last-child) {
    margin-bottom: 5px;
  }
}
</style>
