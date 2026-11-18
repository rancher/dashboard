<script lang="ts">
import { defineComponent } from 'vue';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import CruResource from '@shell/components/CruResource.vue';
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import ArrayList from '@shell/components/form/ArrayList.vue';
import { LabeledInput } from '@components/Form/LabeledInput';

export default defineComponent({
  name: 'EditPersona',

  emits: ['input'],

  inheritAttrs: false,

  components: {
    CruResource,
    NameNsDescription,
    ArrayList,
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
    };
  },

  computed: {
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
  </CruResource>
</template>
