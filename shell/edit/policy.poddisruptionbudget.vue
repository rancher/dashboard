<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Tab from '@shell/components/Tabbed/Tab';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Labels from '@shell/components/form/Labels';
import { LabeledInput } from '@components/form/LabeledInput';
import ResourceSelector from '@shell/components/form/ResourceSelector';
import { POD } from '@shell/config/types';
import FormValidation from '@shell/mixins/form-validation';

export default {
  name: 'PodDisruptionBudget',

  components: {
    ResourceSelector,
    CruResource,
    Labels,
    LabeledInput,
    NameNsDescription,
    ResourceTabs,
    Tab,
  },

  mixins: [CreateEditView, FormValidation],

  data() {
    if ( !this.value.spec ) {
      this.$set(this.value, 'spec', {
        selector: {
          matchExpressions: [],
          matchLabels:      {},
        }
      });
    }

    return { POD };
  },

  watch: {
    'value.spec.minAvailable'(val) {
      const isNumeric = /^\\d+$/;

      if (val && isNumeric.test(val)) {
        this.value.spec.minAvailable = parseInt(val, 10);
      } else if (!val) {
        delete this.value.spec.minAvailable;
      }
    },
    'value.spec.maxUnavailable'(val) {
      const isNumeric = /^\\d+$/;

      if (val && isNumeric.test(val)) {
        this.value.spec.maxUnavailable = parseInt(val, 10);
      } else if (!val) {
        delete this.value.spec.maxUnavailable;
      }
    }
  },
};
</script>

<template>
  <CruResource
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="true"
    :errors="errors"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription
      :value="value"
      :mode="mode"
      :register-before-hook="registerBeforeHook"
      :namespaced="true"
    />

    <ResourceTabs v-model="value" :mode="mode" :side-tabs="true">
      <Tab name="volumeclaim" :label="t('podDisruptionBudget.budget.label')" :weight="4">
        <div class="row">
          <div class="col span-6">
            <LabeledInput
              v-model="value.spec.minAvailable"
              :mode="mode"
              :label="t('podDisruptionBudget.minAvailable.label')"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model="value.spec.maxUnavailable"
              :mode="mode"
              :label="t('podDisruptionBudget.maxUnavailable.label')"
            />
          </div>
        </div>
      </Tab>
      <Tab name="selectors" :label="t('generic.selectors.label')">
        <ResourceSelector :type="POD" :value="value.spec.selector" :mode="mode" :namespace="value.metadata.namespace" />
      </Tab>
      <Tab
        name="labels-and-annotations"
        label-key="generic.labelsAndAnnotations"
        :weight="-1"
      >
        <Labels
          default-container-class="labels-and-annotations-container"
          :value="value"
          :mode="mode"
          :display-side-by-side="false"
        />
      </Tab>
    </ResourceTabs>
  </CruResource>
</template>
