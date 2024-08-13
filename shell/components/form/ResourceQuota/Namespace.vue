<script>
import Row from './NamespaceRow';
import { QUOTA_COMPUTED } from './shared';

export default {
  components: { Row },

  props: {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    project: {
      type:     Object,
      required: true
    },
    types: {
      type:    Array,
      default: () => {
        return [];
      }
    }
  },

  data() {
    return { rows: {} };
  },

  computed: {
    ...QUOTA_COMPUTED,
    projectResourceQuotaLimits() {
      return this.project?.spec?.resourceQuota?.limit || {};
    },
    namespaceResourceQuotaLimits() {
      return this.project.namespaces.map((namespace) => ({
        ...namespace.resourceQuota.limit,
        id: namespace.id
      }));
    },
    editableLimits() {
      return Object.keys(this.projectResourceQuotaLimits);
    },
    defaultResourceQuotaLimits() {
      return this.project.spec.namespaceDefaultResourceQuota.limit;
    }
  },

  methods: {
    remainingTypes(currentType) {
      return this.mappedTypes
        .filter((type) => !this.types.includes(type.value) || type.value === currentType);
    },
    update(key, value) {
      const resourceQuota = {
        limit: {
          ...this.value.resourceQuota.limit,
          [key]: value
        }
      };

      this.value['resourceQuota'] = resourceQuota;
    }
  },
};
</script>
<template>
  <div>
    <div class="headers mb-10">
      <div class="mr-10">
        <label>{{ t('resourceQuota.headers.resourceType') }}</label>
      </div>
      <div class="mr-10">
        <label>{{ t('resourceQuota.headers.projectResourceAvailability') }}</label>
      </div>
      <div class="mr-20">
        <label>{{ t('resourceQuota.headers.limit') }}</label>
      </div>
    </div>
    <Row
      v-for="(limit, i) in editableLimits"
      :key="i"
      :value="value.resourceQuota"
      :namespace="value"
      :mode="mode"
      :types="mappedTypes"
      :type="limit"
      :project-resource-quota-limits="projectResourceQuotaLimits"
      :default-resource-quota-limits="defaultResourceQuotaLimits"
      :namespace-resource-quota-limits="namespaceResourceQuotaLimits"
      @update:value="update"
    />
  </div>
</template>
<style lang="scss" scoped>
.headers {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    align-items: center;
    border-bottom: 1px solid var(--border);
    height: 30px;

    div {
        width: 100%;
    }
}

.row:not(:last-of-type) {
  margin-bottom: 10px;
}
</style>
