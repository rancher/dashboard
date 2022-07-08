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
          return this.schemaForGroup(g);
        });

        return schemas?.flatMap(schema => schema?.map(s => s?.attributes?.resource));
      }

      return null;
    }
  },

  methods: {
    schemaForGroup(group) {
      if ( !!group ) {
        const name = this.$store.getters[`${ this.inStore }/schemaName`]({ type: group });

        return this.schemas?.filter((s) => {
          return s._group === name;
        });
      }

      return null;
    }
  }
};
</script>

<template>
  <div v-if="value" class="mt-40">
    <div class="row mb-20">
      <div class="col span-12">
        <h4>{{ t('kubewarden.policyConfig.apiGroups.title') }}</h4>
        <LabeledSelect
          v-model="value.apiGroups"
          :label="t('kubewarden.policyConfig.apiGroups.label')"
          :mode="mode"
          :multiple="true"
          :options="apiGroupOptions"
        />
      </div>
    </div>

    <div class="row mb-20">
      <div class="col span-12">
        <h4>{{ t('kubewarden.policyConfig.apiVersions.title') }}</h4>
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
    </div>

    <div class="row mb-20">
      <div class="col span-12">
        <h4>{{ t('kubewarden.policyConfig.operations.title') }}</h4>
        <LabeledSelect
          v-model="value.operations"
          :label="t('kubewarden.policyConfig.operations.label')"
          :mode="mode"
          :multiple="true"
          :options="operationOptions || []"
          :tooltip="t('kubewarden.policyConfig.operations.tooltip')"
        />
      </div>
    </div>

    <div class="row mb-20">
      <div class="col span-12">
        <h4>{{ t('kubewarden.policyConfig.mode.title') }}</h4>
        <LabeledSelect
          v-model="value.resources"
          :label="t('kubewarden.policyConfig.mode.label')"
          :mode="mode"
          :multiple="true"
          :options="resourceOptions || []"
          :tooltip="t('kubewarden.policyConfig.mode.tooltip')"
        />
      </div>
    </div>
  </div>
</template>
