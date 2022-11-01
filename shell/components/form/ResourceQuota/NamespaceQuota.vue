<script>
import Row from './NamespaceQuotaRow';

const TYPES_WITH_STORAGE_CLASS = ['requestsStorageClassStorage', 'requestsStorageClassPVC'];

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
    },
    storageClasses: {
      type:    Array,
      default: () => {
        return [];
      }
    },
  },

  data() {
    return { rows: {} };
  },

  computed: {
    mappedTypes() {
      return this.types
        .map(type => ({
          label:       this.t(type.labelKey),
          baseUnit:    type.baseUnitKey ? this.t(type.baseUnitKey) : undefined,
          placeholder: this.t(type.placeholderKey),
          ...type,
        }));
    },
    projectResourceQuotaLimits() {
      return this.project?.spec?.resourceQuota?.limit || {};
    },
    namespaceResourceQuotaLimits() {
      return this.project.namespaces.map(namespace => ({
        ...namespace.resourceQuota.limit,
        id: namespace.id
      }));
    },
    editableLimits() {
      return Object.entries(this.projectResourceQuotaLimits).reduce((t, [k, v]) => {
        if (TYPES_WITH_STORAGE_CLASS.includes(k)) {
          Object.entries(v).forEach(([sc, q]) => {
            t.push({
              type:  k,
              sc,
              limit: q,
            });
          });
        } else {
          t.push({
            type:  k,
            limit: v,
          });
        }

        return t;
      }, []);
    },
    defaultResourceQuotaLimits() {
      return this.project.spec.namespaceDefaultResourceQuota.limit;
    }
  },

  methods: {
    remainingTypes(currentType) {
      return this.mappedTypes
        .filter(type => !this.types.includes(type.value) || type.value === currentType);
    },
    update(key, value, sc) {
      if (sc) {
        // console.log(this.value.resourceQuota.limit[key]);
        // console.log(key, sc, value);
        const resourceQuota = {
          limit: {
            ...this.value.resourceQuota.limit,
            [key]: {
              ...this.value.resourceQuota.limit[key],
              [sc]: value
            }
          }
        };

        this.$set(this.value, 'resourceQuota', resourceQuota);

        return;
      }
      const resourceQuota = {
        limit: {
          ...this.value.resourceQuota.limit,
          [key]: value
        }
      };

      this.$set(this.value, 'resourceQuota', resourceQuota);
    }
  },
};
</script>
<template>
  <div>
    <div class="headers mb-10">
      <label>{{ t('resourceQuota.headers.resourceType') }}</label>
      <label>{{ t('resourceQuota.headers.projectResourceAvailability') }}</label>
      <label>{{ t('resourceQuota.headers.limit') }}</label>
    </div>
    <Row
      v-for="q in editableLimits"
      :key="project.id + q.type + (q.sc || '') "
      :value="value.resourceQuota"
      :namespace="value"
      :mode="mode"
      :types="mappedTypes"
      :type="q.type"
      :storage-class="q.sc"
      :storage-classes="storageClasses"
      :project-resource-quota-limits="projectResourceQuotaLimits"
      :default-resource-quota-limits="defaultResourceQuotaLimits"
      :namespace-resource-quota-limits="namespaceResourceQuotaLimits"
      @input="update"
    />
  </div>
</template>
<style lang="scss" scoped>
.headers {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    column-gap: 10px;
    align-items: center;
    border-bottom: 1px solid var(--border);
    height: 30px;
}
</style>
