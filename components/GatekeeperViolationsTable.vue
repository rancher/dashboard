<script>
import SortableTable from '@/components/SortableTable';
import { findAllConstraints } from '@/utils/gatekeeper/util';

export default {
  components: { SortableTable },
  props:      {
    constraint: {
      type:    Object,
      default: null
    },
    includeConstraint: {
      type:    Boolean,
      default: false
    }
  },
  data(ctx) {
    return {
      headers: [
        {
          name:  'Type',
          label: 'Type',
          value: `kind`,
          sort:  `kind`,
          width: 75,
        },
        {
          name:  'Name',
          label: 'Name',
          value: 'nameDisplay',
          sort:  `nameDisplay`,
          width: 270
        },
        this.includeConstraint ? {
          name:  'Constraint',
          label: 'Constraint',
          value: 'constraint.metadata.name',
          sort:  `constraint.metadata.name`,
          width: 200
        } : null,
        {
          name:  'Message',
          label: 'Message',
          value: `message`,
          sort:  `message`
        }
      ].filter(h => h),
      violations: []
    };
  },

  async created() {
    const constraints = this.constraint ? [this.constraint] : await findAllConstraints(this.$store);

    this.violations = constraints
      .map((constraint, i) => ({
        constraint,
        violations: constraint?.status?.violations || []
      }))
      .map(pair => pair.violations.map((v, i) => ({
        ...v, nameDisplay: v.name, constraint:  pair.constraint
      })))
      .flat()
      .map((violation, i) => ({ ...violation, id: i }));
  },

};
</script>

<template>
  <div class="gatekeeper-violations">
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
</template>
