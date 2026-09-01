<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import SortableTable from '@shell/components/SortableTable';
import Banner from '@components/Banner/Banner.vue';
import {
  CONSTRAINT_VIOLATION_RESOURCE_LINK,
  CONSTRAINT_VIOLATION_MESSAGE,
  CONSTRAINT_VIOLATION_TYPE,
  CONSTRAINT_VIOLATION_NAMESPACE,
} from '@shell/config/table-headers';

export default {
  components: { Banner, SortableTable },
  mixins:     [CreateEditView],
  data() {
    const headers = [
      CONSTRAINT_VIOLATION_TYPE,
      CONSTRAINT_VIOLATION_NAMESPACE,
      CONSTRAINT_VIOLATION_RESOURCE_LINK,
      CONSTRAINT_VIOLATION_MESSAGE
    ];

    return {
      headers,
      violations: this.value.violations.map((violation, i) => ({ ...violation, id: i }))
    };
  }
};
</script>
<template>
  <div>
    <div
      v-if="value.spec.enforcementAction"
      class="row mt-20"
    >
      <div class="col span-12">
        <h3>
          {{ t('gatekeeperConstraint.enforcement.action') }}
        </h3>
        {{ value.spec.enforcementAction }}
      </div>
    </div>
    <div class="row mt-20">
      <div class="col span-12">
        <h3 class="mb-20">
          {{ t('gatekeeperConstraint.violations.title', { total: value.totalViolations }) }}
        </h3>
        <Banner
          v-if="value.totalViolations !== value.violations.length"
          color="info"
        >
          {{ t('gatekeeperConstraint.violations.notAll', { shown: value.violations.length }) }}
        </Banner>
        <SortableTable
          :headers="headers"
          :rows="violations"
          :table-actions="false"
          :row-actions="false"
          :paging="true"
          :rows-per-page="10"
          key-field="id"
        />
      </div>
    </div>
  </div>
</template>
