<script>
import SortableTable from '@/components/SortableTable';
import ButtonGroup from '@/components/ButtonGroup';
import { STATE, NAME, AGE } from '@/config/table-headers';
import { mapPref, GROUP_RESOURCES } from '@/store/prefs';
import { removeObject } from '@/utils/array';
import { get } from '@/utils/object';

export default {
  name:       'ListNamespace',
  components: { ButtonGroup, SortableTable },

  props: {
    schema: {
      type:     Object,
      required: true,
    },

    rows: {
      type:     Array,
      required: true,
    },
  },

  computed: {
    get,

    headers() {
      const project = {
        name:          'project',
        label:         'Project',
        value:         'project.nameDisplay',
        sort:          ['projectNameSort', 'nameSort'],
      };

      const out = [
        STATE,
        { ...NAME, label: 'Namespace Name' },
        project,
        AGE
      ];

      if ( this.groupBy || !this.groupable ) {
        removeObject(out, project);
      }

      return out;
    },

    group: mapPref(GROUP_RESOURCES),

    groupable() {
      return this.$store.getters['isRancher'];
    },

    groupBy() {
      // The value of the preference is "namespace" but we take that to mean group by project here...
      if (this.group === 'namespace') {
        return 'groupByName';
      }

      return null;
    },

    groupOptions() {
      return [
        { value: 'none', icon: 'icon-list-flat' },
        { value: 'namespace', icon: 'icon-list-grouped' }
      ];
    },

    pagingParams() {
      return {
        singularLabel: this.$store.getters['type-map/singularLabelFor'](this.schema),
        pluralLabel:   this.$store.getters['type-map/pluralLabelFor'](this.schema),
      };
    },
  },
};
</script>

<template>
  <SortableTable
    v-bind="$attrs"
    :headers="headers"
    :rows="rows"
    :group-by="groupBy"
    :paging="true"
    :paging-params="pagingParams"
    paging-label="sortableTable.paging.resource"
    key-field="_key"
    v-on="$listeners"
  >
    <template v-if="groupable" #header-middle>
      <slot name="more-header-middle" />
      <ButtonGroup v-model="group" :options="groupOptions" />
    </template>

    <template #group-by="{group: thisGroup}">
      <div v-if="thisGroup.ref" class="group-tab">
        {{ t('resourceTable.groupLabel.project') }}
        <nuxt-link :to="thisGroup.rows[0].project.location">
          {{ thisGroup.rows[0].project.spec.displayName }}
        </nuxt-link>
      </div>
      <div v-else class="group-tab">
        {{ t('resourceTable.groupLabel.notInAProject') }}
      </div>
    </template>

    <template #cell:project="{row}">
      <span v-if="row.project">{{ row.project.nameDisplay }}</span>
      <span v-else class="text-muted">&ndash;</span>
    </template>
  </SortableTable>
</template>
