<script>
import { QUOTA_COMPUTED, TYPES } from './shared';
import Banner from '@components/Banner/Banner.vue';
import ResourceQuota from '@shell/components/form/ResourceQuota/ResourceQuotaEntry.vue';
import { RcButton } from '@components/RcButton';
import { uniqueId } from 'lodash';

export default {
  emits: [
    'input',
    'validationChanged',
  ],

  components: {
    Banner,
    RcButton,
    ResourceQuota,
  },

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
    types: {
      type:    Array,
      default: () => {
        return [];
      }
    }
  },

  data() {
    return { resourceQuotas: [] };
  },

  created() {
    this.value['spec'] = this.value.spec || {};
    this.value.spec['namespaceDefaultResourceQuota'] = this.value.spec.namespaceDefaultResourceQuota || { limit: {} };
    this.value.spec['resourceQuota'] = this.value.spec.resourceQuota || { limit: {} };

    this.quotasFromSpec();

    /**
     * Register watcher using the imperative API to reduce churn when initialing
     * data on first render
     */
    this.$watch(
      'resourceQuotas',
      () => {
        const { projectLimit, nsLimit } = this.specFromQuotas();

        this.$emit('input', { projectLimit, nsLimit });

        const hasMissingExtendedIdentifier = this.resourceQuotas.some(
          (quota) => quota.resourceType === TYPES.EXTENDED && !quota.resourceIdentifier
        );

        this.$emit('validationChanged', !hasMissingExtendedIdentifier);
      },
      { deep: true }
    );
  },

  computed: { ...QUOTA_COMPUTED },

  methods: {
    addResource() {
      this.resourceQuotas.push({
        id:                    uniqueId(),
        resourceType:          TYPES.EXTENDED,
        resourceIdentifier:    '',
        projectLimit:          '',
        namespaceDefaultLimit: '',
      });
    },

    removeResource(id) {
      this.resourceQuotas = this.resourceQuotas.filter((quota) => quota.id !== id);
    },

    remainingTypes(currentType) {
      const usedTypes = this.resourceQuotas
        .map((quota) => quota.resourceType)
        .filter((resourceType) => resourceType !== TYPES.EXTENDED);

      return this.mappedTypes.filter((mappedType) => mappedType.value === TYPES.EXTENDED ||
        !usedTypes.includes(mappedType.value) ||
        mappedType.value === currentType
      );
    },

    specFromQuotas() {
      const projectLimit = {};
      const nsLimit = {};

      this.resourceQuotas.forEach((quota) => {
        if (quota.resourceType === TYPES.EXTENDED) {
          if (quota.resourceIdentifier) {
            if (!projectLimit.extended) {
              projectLimit.extended = {};
            }
            if (!nsLimit.extended) {
              nsLimit.extended = {};
            }
            projectLimit.extended[quota.resourceIdentifier] = quota.projectLimit;
            nsLimit.extended[quota.resourceIdentifier] = quota.namespaceDefaultLimit;
          }
        } else {
          projectLimit[quota.resourceType] = quota.projectLimit;
          nsLimit[quota.resourceType] = quota.namespaceDefaultLimit;
        }
      });

      return { projectLimit, nsLimit };
    },

    quotasFromSpec() {
      const projectLimit = this.value?.spec?.resourceQuota?.limit || {};
      const nsLimit = this.value?.spec?.namespaceDefaultResourceQuota?.limit || {};

      Object.keys(projectLimit).forEach((key) => {
        if (key !== TYPES.EXTENDED) {
          this.resourceQuotas.push({
            id:                    uniqueId(),
            resourceType:          key,
            resourceIdentifier:    key,
            projectLimit:          projectLimit[key],
            namespaceDefaultLimit: nsLimit[key] || '',
          });
        } else {
          Object.keys(projectLimit.extended || {}).forEach((extKey) => {
            this.resourceQuotas.push({
              id:                    uniqueId(),
              resourceType:          TYPES.EXTENDED,
              resourceIdentifier:    extKey,
              projectLimit:          projectLimit.extended[extKey],
              namespaceDefaultLimit: (nsLimit.extended || {})[extKey] || '',
            });
          });
        }
      });
    }
  },
};
</script>
<template>
  <div
    role="grid"
    :aria-label="t('resourceQuota.ariaLabel.grid')"
  >
    <Banner
      color="info"
      label-key="resourceQuota.banner"
      class="mb-20"
    />
    <div
      role="row"
      class="headers mb-10"
    >
      <div
        role="columnheader"
        class="mr-10"
      >
        <label>
          {{ t('resourceQuota.headers.resourceType') }}
          <span
            class="required mr-5"
            aria-hidden="true"
          >*</span>
        </label>
      </div>
      <div
        role="columnheader"
        class="mr-20"
      >
        <label>
          {{ t('resourceQuota.headers.resourceIdentifier') }}
          <span
            class="required mr-5"
            aria-hidden="true"
          >*</span>
          <i
            v-clean-tooltip="t('resourceQuota.resourceIdentifier.tooltip')"
            class="icon icon-info"
          />
        </label>
      </div>
      <div
        role="columnheader"
        class="mr-20"
      >
        <label>{{ t('resourceQuota.headers.projectLimit') }}</label>
      </div>
      <div
        role="columnheader"
        class="mr-10"
      >
        <label>{{ t('resourceQuota.headers.namespaceDefaultLimit') }}</label>
      </div>
    </div>
    <template
      v-for="(resourceQuota, resourceQuotaIndex) in resourceQuotas"
      :key="resourceQuota.id"
    >
      <ResourceQuota
        :id="resourceQuota.id"
        v-model:resource-type="resourceQuota.resourceType"
        v-model:resource-identifier="resourceQuota.resourceIdentifier"
        v-model:project-limit="resourceQuota.projectLimit"
        v-model:namespace-default-limit="resourceQuota.namespaceDefaultLimit"
        :index="resourceQuotaIndex + 1"
        :types="remainingTypes(resourceQuota.resourceType)"
        :mode="mode"
        @remove="removeResource"
      />
    </template>
    <div class="project-quotas-footer">
      <rc-button
        variant="tertiary"
        data-testid="btn-add-resource"
        @click="addResource"
      >
        {{ t('resourceQuota.add.label') }}
      </rc-button>
    </div>
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
    width: calc(100% - 75px);

    div {
        width: 100%;
    }
}

.required {
  color: var(--error);
}

.project-quotas-footer {
  margin-top: 24px;
}
</style>
