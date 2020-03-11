<script>
import { SCHEMA } from '@/config/types';
import { AGE, NAME, STATE } from '@/config/table-headers';
import SortableTable from '@/components/SortableTable';
import { DESCRIPTION } from '@/config/labels-annotations';

function findTemplateType(schemas) {
  // @TODO this will just be a regular single type now that the server filters to preferred version
  // so you can just add templates.gatekeeper.sh.constrainttemplate as a constant in types.js
  const template = schemas.find((schema) => {
    return schema?.attributes?.group === 'templates.gatekeeper.sh' &&
      schema?.attributes?.kind === 'ConstraintTemplate';
  });

  return template?.id;
}

function findConstraintTypes(schemas) {
  return schemas
    .filter(schema => schema?.attributes?.group === 'constraints.gatekeeper.sh')
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
    const schemas = this.$store.getters['cluster/all'](SCHEMA);

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
