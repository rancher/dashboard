<script>
import { SCHEMA, API_GROUP } from '@/config/types';
import { AGE, NAME, STATE } from '@/config/table-headers';
import SortableTable from '@/components/SortableTable';
import { DESCRIPTION } from '@/config/labels-annotations';

const CONSTRAINTS_REGEX = new RegExp(/^(.*\.)?constraints.gatekeeper.sh.*$/);
const CONSTRAINT_TEMPLATES_REGEX = new RegExp(/^(.*\.)?templates.gatekeeper.sh.*$/);

function getAllSchemas(store) {
  const schemas = store.getters['cluster/all'](SCHEMA);

  return schemas.filter((schema) => {
    const attrs = schema.attributes || {};
    const groupName = attrs.group || 'core';
    const api = store.getters['cluster/byId'](API_GROUP, groupName);

    return attrs.kind &&
        (!api?.preferredVersion?.version || (api.preferredVersion.version === attrs.version));
  });
}

function findTemplateType(schemas) {
  return schemas.find(schema => CONSTRAINT_TEMPLATES_REGEX.test(schema.id))?.id;
}

function findConstraintTypes(schemas) {
  return schemas
    .filter(schema => CONSTRAINTS_REGEX.test(schema.id))
    .map(schema => schema.id);
}

export default {
  components: { SortableTable },
  data(ctx) {
    return {
      headers: {
        template: [
          STATE,
          NAME,
          AGE,
        ],
        constraint: [
          STATE,
          NAME,
          {
            name:  'Description',
            label: 'Description',
            value: `description`,
            sort:  `description`
          },
          {
            name:  'Kind',
            label: 'Kind',
            value: 'kind',
            sort:  'kind'
          },
          AGE,
        ]
      },
      templates:   [],
      constraints: []
    };
  },

  async created() {
    const schemas = await getAllSchemas(this.$store);
    const templateType = findTemplateType(schemas);
    const constraintTypes = findConstraintTypes(schemas);

    this.templates = await this.$store.dispatch('cluster/findAll', { type: templateType });
    const rawConstraints = await Promise.all(constraintTypes.map(constraintType => this.$store.dispatch('cluster/findAll', { type: constraintType })));

    this.constraints = rawConstraints
      .flat()
      .map((constraint) => {
        constraint.description = constraint.metadata.annotations[DESCRIPTION];

        return constraint;
      });
  }

};
</script>

<template>
  <div class="gatekeeper-tables">
    <h2>Constraint Templates</h2>
    <SortableTable
      :headers="headers.template"
      :rows="templates"
      :search="false"
      key-field="id"
    />
    <br />
    <h2>Constraints</h2>
    <SortableTable
      :headers="headers.constraint"
      :rows="constraints"
      :search="false"
      key-field="id"
      group-by="kind"
    />
  </div>
</template>
