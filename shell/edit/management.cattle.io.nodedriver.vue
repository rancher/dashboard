<script>

import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource.vue';
import FormValidation from '@shell/mixins/form-validation';
import CreateDriver from '@shell/components/CreateDriver';

export default {
  name: 'NodeDriverCreate',

  components: {
    CruResource,
    CreateDriver
  },

  mixins: [CreateEditView, FormValidation],

  data() {
    return {
      fvFormRuleSets: [
        { path: 'spec.url', rules: ['required', 'url'] },
        { path: 'spec.uiUrl', rules: ['url'] },
        { path: 'spec.checksum', rules: ['alphanumeric'] },
        { path: 'spec.whitelistDomains', rules: ['wildcardHostname'] }
      ]
    };
  },
};
</script>

<template>
  <CruResource
    :mode="mode"
    :show-as-form="true"
    :resource="value"
    :errors="fvUnreportedValidationErrors"
    :validation-passed="fvFormIsValid"
    :cancel-event="true"
    :done-route="doneRoute"
    :apply-hooks="applyHooks"
    component-testid="driver-create"
    @done="done"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <CreateDriver
      :mode="mode"
      :value="value"
      :rules="{url:fvGetAndReportPathRules('spec.url'), uiUrl:fvGetAndReportPathRules('spec.uiUrl'), checksum:fvGetAndReportPathRules('spec.checksum'), whitelistDomains:fvGetAndReportPathRules('spec.whitelistDomains')}"
    />
  </CruResource>
</template>
