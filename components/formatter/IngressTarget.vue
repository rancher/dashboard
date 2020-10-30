<script>
import { WORKLOAD_TYPES } from '@/config/types';

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
      <a v-if="path.isUrl" rel="nofollow noopener noreferrer" target="_blank" :href="`${path.target}`">{{ path.target }}</a>
      <span v-else>{{ path.target }}</span>
      <i class="icon icon-chevron-right" />
      <nuxt-link v-if="path.serviceName && path.serviceTargetTo" :to="path.serviceTargetTo">
        {{ path.serviceName }}
      </nuxt-link>
      <span v-else-if="path.serviceName">
        {{ path.serviceName }}
      </span>
    </div>
    <div v-if="defaultService" class="target">
      <nuxt-link v-if="defaultService.targetTo" :to="defaultService.targetTo">
        {{ t('ingress.target.default') }} <i class="icon icon-chevron-right" /> {{ defaultService.name }}
      </nuxt-link>
      <span v-else>
        {{ t('ingress.target.default') }} <i class="icon icon-chevron-right" /> {{ defaultService.name }}
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
