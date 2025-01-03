<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource.vue';
import FormValidation from '@shell/mixins/form-validation';
import CreateDriver from '@shell/components/CreateDriver';
import { _CREATE } from '@shell/config/query-params';

export default {
  name: 'NodeDriverEdit',

  components: {
    CruResource,
    CreateDriver
  },

  mixins: [CreateEditView, FormValidation],

  inheritAttrs: false,

  data() {
    return {
      fvFormRuleSets: [
        { path: 'url', rules: ['required', 'url'] },
        { path: 'uiUrl', rules: ['url'] },
        { path: 'checksum', rules: ['alphanumeric'] },
        { path: 'whitelistDomains', rules: ['wildcardHostname'] }
      ]
    };
  },
  props: {
    value: {
      type:     Object,
      required: true,
      default:  () => {}
    },
    mode: {
      type:    String,
      default: _CREATE,
    },
  },
};
</script>

<template>
  <CruResource
    :mode="mode"
    :show-as-form="true"
    :can-yaml="false"
    :resource="value"
    :errors="fvUnreportedValidationErrors"
    :validation-passed="fvFormIsValid"
    :cancel-event="true"
    :done-route="doneRoute"
    :apply-hooks="applyHooks"
    component-testid="node-driver-edit"
    @done="done"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <CreateDriver
      :mode="mode"
      :value="value"
      :rules="{
        url: fvGetAndReportPathRules('url'),
        uiUrl: fvGetAndReportPathRules('uiUrl'),
        checksum: fvGetAndReportPathRules('checksum'),
        whitelistDomains: fvGetAndReportPathRules('whitelistDomains')
      }"
    />
  </CruResource>
</template>
