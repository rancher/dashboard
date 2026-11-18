<script lang="ts">
import { defineComponent } from 'vue';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import CruResource from '@shell/components/CruResource.vue';
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import ArrayList from '@shell/components/form/ArrayList.vue';
import Error from '@shell/components/form/Error.vue';
import GrantResources from '@shell/components/auth/GrantResources.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { SCOPED_RESOURCES, SCOPED_RESOURCE_GROUPS } from '@shell/config/roles';
import { grantResourceOptions, normaliseRuleApiGroups, GrantResourceRule } from '@shell/utils/grant-resources';

export default defineComponent({
  name: 'EditPersona',

  emits: ['input'],

  inheritAttrs: false,

  components: {
    CruResource,
    NameNsDescription,
    ArrayList,
    Error,
    GrantResources,
    LabeledInput,
  },

  mixins: [
    CreateEditView,
    FormValidation
  ],

  data() {
    return {
      fvFormRuleSets: [
        {
          path: 'metadata.name', rules: ['subDomain'], translationKey: 'nameNsDescription.name.label'
        },
        {
          path: 'spec.displayName', rules: ['required'], translationKey: 'persona.displayName.label'
        },
        {
          path: 'spec.priority', rules: ['requiredInt', 'isInteger'], translationKey: 'persona.priority.label'
        },
      ],
      defaultRule: {
        apiGroups: [''], resources: [], verbs: []
      } as GrantResourceRule,
    };
  },

  created() {
    this.registerBeforeHook(() => normaliseRuleApiGroups(this.value.spec.rules));
  },

  computed: {
    resourceOptions() {
      return grantResourceOptions((key: string) => this.t(key), Object.keys(SCOPED_RESOURCES) as SCOPED_RESOURCE_GROUPS[]);
    },

    rules: {
      get(): GrantResourceRule[] {
        return this.value.spec.rules || [];
      },

      set(rules: GrantResourceRule[]) {
        this.value.spec.rules = rules;
      }
    },

    priority: {
      get(): number | string {
        return this.value.spec.priority;
      },

      set(val: string) {
        // Keep '' rather than null: form validation skips null values, so requiredInt would never fail
        this.value.spec.priority = val === '' ? val : Number(val);
      }
    },
  },
});
</script>

<template>
  <CruResource
    :mode="mode"
    :resource="value"
    :done-route="doneRoute"
    :errors="errors"
    :validation-passed="fvFormIsValid"
    @finish="save"
    @error="e=>errors=e"
  >
    <div class="row mt-20">
      <div class="col span-12">
        <NameNsDescription
          :value="value"
          :mode="mode"
          :namespaced="false"
          description-placeholder="persona.description.placeholder"
          :rules="{ name: fvGetAndReportPathRules('metadata.name'), description: [] }"
          @update:value="$emit('input', $event)"
        />
      </div>
    </div>
    <div class="row mt-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.displayName"
          :mode="mode"
          :label="t('persona.displayName.label')"
          :placeholder="t('persona.displayName.placeholder')"
          :required="true"
          :rules="fvGetAndReportPathRules('spec.displayName')"
          data-testid="persona-display-name"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          v-model:value="priority"
          type="number"
          :mode="mode"
          :label="t('persona.priority.label')"
          :tooltip="t('persona.priority.tooltip')"
          :required="true"
          :rules="fvGetAndReportPathRules('spec.priority')"
          data-testid="persona-priority"
        />
      </div>
    </div>
    <div class="row mt-20">
      <div class="col span-6">
        <ArrayList
          v-model:value="value.spec.tags"
          :mode="mode"
          :title="t('persona.tags.label')"
          :a11y-label="t('persona.tags.label')"
          :add-label="t('persona.tags.addLabel')"
          :protip="false"
          :show-header="true"
          :value-label="''"
          data-testid="persona-tags"
        />
      </div>
    </div>
    <div class="row mt-20">
      <div class="col span-12">
        <h3>{{ t('persona.resourcePermissions.label') }}</h3>
        <p class="mb-10">
          {{ t('persona.resourcePermissions.description') }}
        </p>
        <Error
          :value="rules"
          :rules="fvGetAndReportPathRules('spec.rules')"
          as-banner
        />
        <GrantResources
          v-model:value="rules"
          :mode="mode"
          :resource-options="resourceOptions"
          :default-rule="defaultRule"
          :show-non-resource-urls="false"
          :initial-empty-row="false"
          data-testid="persona-resource-permissions"
        />
      </div>
    </div>
  </CruResource>
</template>
