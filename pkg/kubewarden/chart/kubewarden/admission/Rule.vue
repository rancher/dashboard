<script>
import flatMap from 'lodash/flatMap';
import { _CREATE } from '@shell/config/query-params';
import { SCHEMA } from '@shell/config/types';

import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  name: 'Rule',

  props: {
    // Full list of available apiGroups
    apiGroups: {
      type:     Array,
      required: true
    },

    mode: {
      type:    String,
      default: _CREATE
    },

    value: {
      type:    Object,
      default: () => {}
    }
  },

  inject: ['chartType'],

  components: { LabeledSelect },

  fetch() {
    this.inStore = this.$store.getters['currentStore']();

    this.schemas = this.$store.getters[`${ this.inStore }/all`](SCHEMA);
  },

  data() {
    const operationOptions = [
      'CREATE',
      'UPDATE',
      'DELETE'
    ];

    return {
      operationOptions,

      inStore:           null,
      noResourceOptions: false,
      schemas:           null
    };
  },

  computed: {
    apiGroupOptions() {
      if ( this.apiGroups?.length > 0 ) {
        const out = [];

        this.apiGroups.map(g => out.push(g.id));

        return out;
      }

      return this.apiGroups;
    },

    apiVersionOptions() {
      if ( this.value?.apiGroups ) {
        const groups = this.value.apiGroups;
        let versionsByGroup = [];

        groups.forEach((group) => {
          this.apiGroups.find((g) => {
            if ( g.id === group ) {
              const out = flatMap(g.versions, (v) => {
                return v.groupVersion;
              });

              versionsByGroup = [...versionsByGroup, out];
            }
          });
        });

        return flatMap(versionsByGroup);
      }

      return [];
    },

    resourceOptions() {
      if ( this.value?.apiGroups?.length > 0 ) {
        const schemas = this.value.apiGroups.map((g) => {
          /*
            If 'core' is selected we want to show all of the available resources
            Comparable to `kubectl api-resources -o wide`
          */
          if ( g === 'core' ) {
            return this.schemas;
          }

          return this.schemaForGroup(g);
        })[0];

        const filtered = schemas?.filter(s => s.attributes?.resource);

        return filtered.map(f => f.attributes.resource);
      }

      return null;
    }
  },

  methods: {
    schemaForGroup(group) {
      if ( !!group ) {
        return this.schemas?.filter((s) => {
          return s._group === group;
        });
      }

      return null;
    }
  }
};
</script>

<template>
  <div v-if="value" class="rules-row mt-40 mb-20">
    <div class="">
      <LabeledSelect
        v-model="value.apiGroups"
        :label="t('kubewarden.policyConfig.apiGroups.label')"
        :mode="mode"
        :multiple="true"
        :options="apiGroupOptions || []"
      />
    </div>

    <div class="">
      <LabeledSelect
        v-model="value.apiVersions"
        :clearable="true"
        :searchable="false"
        :mode="mode"
        :multiple="true"
        :options="apiVersionOptions || []"
        placement="bottom"
        :label="t('kubewarden.policyConfig.apiVersions.label')"
      >
        <template #options="opt">
          <span>{{ opt }}</span>
        </template>
      </LabeledSelect>
    </div>

    <div class="">
      <LabeledSelect
        v-model="value.operations"
        :label="t('kubewarden.policyConfig.operations.label')"
        :mode="mode"
        :multiple="true"
        :options="operationOptions || []"
        :tooltip="t('kubewarden.policyConfig.operations.tooltip')"
      />
    </div>

    <div class="">
      <LabeledSelect
        v-model="value.resources"
        :label="t('kubewarden.policyConfig.resources.label')"
        :mode="mode"
        :multiple="true"
        :options="resourceOptions || []"
        :tooltip="t('kubewarden.policyConfig.resources.tooltip')"
      />
    </div>

    <slot name="removeRule" class="" />
  </div>
</template>

<style lang="scss" scoped>
.rules-row{
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  grid-column-gap: $column-gutter;
  align-items: center;
}
</style>
