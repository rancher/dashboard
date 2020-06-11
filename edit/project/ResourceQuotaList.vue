<script>
import { _EDIT } from '@/config/query-params';
import ResourceQuota, { RESOURCE_MAPPING } from './ResourceQuota';

export default {
  name: 'ResourceQuotaList',

  components: { ResourceQuota },

  props: {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:     Array,
      required: true
    }
  },

  data() {
    return { quotas: this.value };
  },

  computed: {
    isEdit() {
      return this.mode === _EDIT;
    },

    canAddMore() {
      const numberOfResources = Object.keys(RESOURCE_MAPPING).length;

      return this.quotas.length < numberOfResources;
    },
    columnSpans() {
      if (this.isEdit) {
        return ['span-5', 'span-3', 'span-3', 'span-1'];
      }

      return ['span-2', 'span-2', 'span-2', 'span-1'];
    }
  },

  methods: {
    add() {
      this.quotas.push({ resource: '' });
    },
    remove(i) {
      this.quotas.splice(i, 1);
    },
  }
};
</script>
<template>
  <div class="resource-quota-list">
    <div class="headings row">
      <div class="col" :class="{'span-5': isEdit, 'span-3': !isEdit}">
        {{ t('projectPage.tabs.resourceQuota.headers.resourceType') }}
      </div>
      <div class="col span-3">
        {{ t('projectPage.tabs.resourceQuota.headers.projectLimit') }}
      </div>
      <div class="col span-3">
        {{ t('projectPage.tabs.resourceQuota.headers.defaultLimit') }}
      </div>
      <div class="col span-1" />
    </div>
    <ResourceQuota
      v-for="(quota, i) in quotas"
      :key="i"
      :value="quota"
      :mode="mode"
      :selection="quotas"
      @remove="() => remove(i)"
    />
    <button v-if="isEdit && canAddMore" class="btn role-tertiary add mt-10 " type="button" @click="add">
      {{ t('projectPage.tabs.resourceQuota.add') }}
    </button>
  </div>
</template>

<style lang="scss">
.resource-quota-list {
  .headings {
    border: solid 1px var(--sortable-table-top-divider);
    border-width: 0 0 1px 0;
    padding: 0 10px 10px 0;
    color: var(--secondary);
    font-weight: normal;
  }
}
</style>
