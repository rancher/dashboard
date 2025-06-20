
<script lang="ts">
import { defineComponent } from 'vue';
import CreateEditView from '@shell/mixins/create-edit-view';
import ArrayList from '@shell/components/form/ArrayList.vue';
import UnitInput from '@shell/components/form/UnitInput.vue';
import CruResource from '@shell/components/CruResource.vue';
import FormValidation from '@shell/mixins/form-validation';
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';

const DEFAULT_REF_TOKEN_EXP = 3600;
const DEFAULT_TOKEN_EXP = 600;

export default defineComponent({
  name: 'EditOidcClient',

  emits: ['input'],

  inheritAttrs: false,

  components: {
    CruResource,
    NameNsDescription,
    ArrayList,
    UnitInput,
  },

  mixins: [
    CreateEditView,
    FormValidation
  ],

  created() {
    // setup the data for creation scenario
    if (this.isCreate) {
      this.value.spec = {
        refreshTokenExpirationSeconds: DEFAULT_REF_TOKEN_EXP,
        tokenExpirationSeconds:        DEFAULT_TOKEN_EXP
      };
    }
  },

  data() {
    return {
      fvFormRuleSets: [
        { path: 'metadata.name', rules: ['required'] },
        { path: 'spec.redirectURIs', rules: ['required', 'genericUrl'] },
        { path: 'spec.refreshTokenExpirationSeconds', rules: ['required'] },
        { path: 'spec.tokenExpirationSeconds', rules: ['required'] },
      ],
    };
  },

  computed: {
    finishButtonMode(): string {
      return this.isCreate ? 'registerApplication' : 'saveApplication';
    },

    doneLocationOverride() {
      if (this.isCreate) {
        const afterCreateRoute = Object.assign({}, this.value.detailLocation);

        afterCreateRoute.state = { displaySecret: 'true' };

        return afterCreateRoute;
      }

      return undefined;
    },
  },
});
</script>

<template>
  <CruResource
    :mode="mode"
    :resource="value"
    :doneLocationOverride="doneLocationOverride"
    class="create-edit"
    :finish-button-mode="finishButtonMode"
    :errors="errors"
    :validation-passed="fvFormIsValid"
    @finish="save"
    @error="e=>errors=e"
  >
    <div class="mb-10">
      <!-- app name, app description -->
      <div class="row mt-20">
        <div class="col span-12">
          <NameNsDescription
            :value="value"
            :mode="mode"
            :namespaced="false"
            :name-placeholder="'oidcclient.appName.placeholder'"
            :description-key="'spec.description'"
            :description-placeholder="'oidcclient.appDescription.placeholder'"
            :rules="{ name: fvGetAndReportPathRules('metadata.name'), description: [] }"
            @update:value="$emit('input', $event)"
          />
        </div>
      </div>
      <!-- cb urls, tokens -->
      <div class="row ">
        <div class="col span-6">
          <ArrayList
            v-model:value="value.spec.redirectURIs"
            class="mt-20"
            :mode="mode"
            :title="t('oidcclient.redirectURIs.label')"
            :a11y-label="t('oidcclient.redirectURIs.label')"
            :add-label="t('oidcclient.redirectURIs.addLabel')"
            :required="true"
            :protip="false"
            :showHeader="true"
            :rules="fvGetAndReportPathRules('spec.redirectURIs')"
            :value-label="''"
            data-testid="oidc-client-cb-urls-list"
          />
        </div>
      </div>
      <h3 class="mt-40">
        {{ t('oidcclient.tokenExpirationSeconds.label') }}
      </h3>
      <div class="row mt-20 mb-20">
        <div
          class="col span-3"
          data-testid="oidc-client-token-exp-input"
        >
          <UnitInput
            v-model:value="value.spec.tokenExpirationSeconds"
            :mode="mode"
            :increment="1"
            :required="true"
            base-unit="s"
            :positive="true"
            :rules="fvGetAndReportPathRules('spec.tokenExpirationSeconds')"
            :label="t('oidcclient.tokenExpirationSeconds.label')"
            :sub-label="t('oidcclient.tokenExpirationSeconds.placeholder')"
            :aria-label="t('oidcclient.tokenExpirationSeconds.label')"
          />
        </div>
        <div
          class="col span-3"
          data-testid="oidc-client-ref-token-exp-input"
        >
          <UnitInput
            v-model:value="value.spec.refreshTokenExpirationSeconds"
            :mode="mode"
            :increment="1"
            :required="true"
            base-unit="s"
            :positive="true"
            :rules="fvGetAndReportPathRules('spec.refreshTokenExpirationSeconds')"
            :label="t('oidcclient.refreshTokenExpirationSeconds.label')"
            :sub-label="t('oidcclient.refreshTokenExpirationSeconds.placeholder')"
            :aria-label="t('oidcclient.refreshTokenExpirationSeconds.label')"
          />
        </div>
      </div>
    </div>
  </CruResource>
</template>
