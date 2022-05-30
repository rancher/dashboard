<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import SortableTable from '@shell/components/SortableTable';
import { CONSTRAINT_VIOLATION_RESOURCE_LINK, CONSTRAINT_VIOLATION_MESSAGE, CONSTRAINT_VIOLATION_TYPE } from '@shell/config/table-headers';

export default {
  components: { SortableTable },
  mixins:     [CreateEditView],
  data(ctx) {
    return {
      headers: [
        CONSTRAINT_VIOLATION_TYPE,
        CONSTRAINT_VIOLATION_RESOURCE_LINK,
        CONSTRAINT_VIOLATION_MESSAGE
      ],
      violations:  this.value.violations
        .map((violation, i) => ({ ...violation, id: i }))
    };
  }
};
</script>
<template>
  <div>
    <div v-if="value.spec.enforcementAction" class="row mt-40">
      <div class="col span-12">
        <h3>Enforcement Action</h3>
        {{ value.spec.enforcementAction }}
      </div>
    </div>
    <div class="row mt-40">
      <div class="col span-12">
        <h3>{{ t('gatekeeperConstraint.violations.title') }}</h3>
        <SortableTable
          :headers="headers"
          :rows="violations"
          :search="false"
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
