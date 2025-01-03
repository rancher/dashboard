<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Tab from '@shell/components/Tabbed/Tab';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Labels from '@shell/components/form/Labels';
import { LabeledInput } from '@components/Form/LabeledInput';
import ResourceSelector from '@shell/components/form/ResourceSelector';
import { POD } from '@shell/config/types';
import FormValidation from '@shell/mixins/form-validation';

export default {
  name:  'PodDisruptionBudget',
  emits: ['input'],

  inheritAttrs: false,
  components:   {
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
      this.value['spec'] = {
        selector: {
          matchExpressions: [],
          matchLabels:      {},
        }
      };
    }

    return { POD };
  },

  computed: {
    minAvailable: {
      get() {
        return this.value.spec.minAvailable;
      },
      set(val) {
        const isNumeric = /^\d+$/;

        if (val && isNumeric.test(val)) {
          this.value.spec['minAvailable'] = Number.parseInt(val);
        } else if (val) {
          this.value.spec['minAvailable'] = val;
        } else {
          delete this.value.spec['minAvailable'];
        }
      }
    },
    maxUnavailable: {
      get() {
        return this.value.spec.maxUnavailable;
      },
      set(val) {
        const isNumeric = /^\d+$/;

        if (val && isNumeric.test(val)) {
          this.value.spec['maxUnavailable'] = Number.parseInt(val);
        } else if (val) {
          this.value.spec['maxUnavailable'] = val;
        } else {
          delete this.value.spec['maxUnavailable'];
        }
      }
    },
  }
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

    <ResourceTabs
      :value="value"
      :mode="mode"
      :side-tabs="true"
      @update:value="$emit('input', $event)"
    >
      <Tab
        name="volumeclaim"
        :label="t('podDisruptionBudget.budget.label')"
        :weight="4"
      >
        <div class="row">
          <div class="col span-6">
            <LabeledInput
              v-model:value="minAvailable"
              :mode="mode"
              :label="t('podDisruptionBudget.minAvailable.label')"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model:value="maxUnavailable"
              :mode="mode"
              :label="t('podDisruptionBudget.maxUnavailable.label')"
            />
          </div>
        </div>
      </Tab>
      <Tab
        name="selectors"
        :label="t('generic.selectors.label')"
      >
        <ResourceSelector
          :type="POD"
          :value="value.spec.selector"
          :mode="mode"
          :namespace="value.metadata.namespace"
        />
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
