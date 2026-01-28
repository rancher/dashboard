<script lang="ts">
// Shared AuditPolicy interface for all audit log policy components
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import CruResource from '@shell/components/CruResource.vue';
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import Labels from '@shell/components/form/Labels.vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Loading from '@shell/components/Loading.vue';
import General from '@shell/edit/auditlog.cattle.io.auditpolicy/General.vue';
import Filters from '@shell/edit/auditlog.cattle.io.auditpolicy/Filters.vue';
import AdditionalRedactions from '@shell/edit/auditlog.cattle.io.auditpolicy/AdditionalRedactions.vue';

export default {
  name:       'CRUAuditPolicy',
  components: {
    CruResource,
    General,
    Labels,
    Loading,
    NameNsDescription,
    Filters,
    AdditionalRedactions,
    Tab,
    Tabbed,
  },
  mixins: [CreateEditView, FormValidation],

  created() {
    if ( !this.value.spec ) {
      this.value.spec = { enabled: false };
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="fvFormIsValid"
    :errors="errors"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription
      v-if="!isView"
      :value="value"
      :mode="mode"
      :namespaced="schema.attributes.namespaced"
      :nameRequired="false"
      :register-before-hook="registerBeforeHook"
    />
    <Tabbed :side-tabs="true">
      <Tab
        name="general"
        :label="t('auditPolicy.general.title')"
        :weight="3"
      >
        <General
          v-model:value="value.spec"
          :mode="mode"
        />
      </Tab>
      <Tab
        name="filters"
        :label="t('auditPolicy.filters.title')"
        :weight="2"
      >
        <Filters
          v-model:value="value.spec"
          :mode="mode"
        />
      </Tab>
      <Tab
        name="additional-redactions"
        :label="t('auditPolicy.additionalRedactions.title')"
        :weight="1"
      >
        <AdditionalRedactions
          v-model:value="value.spec"
          :mode="mode"
        />
      </Tab>
      <Tab
        name="labels-and-annotations"
        label-key="generic.labelsAndAnnotations"
        :weight="0"
      >
        <Labels
          default-container-class="labels-and-annotations-container"
          :value="value"
          :mode="mode"
          :display-side-by-side="false"
        />
      </Tab>
    </Tabbed>
  </CruResource>
</template>
