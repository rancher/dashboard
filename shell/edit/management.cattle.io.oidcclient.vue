
<script lang="ts">
import { defineComponent } from 'vue';
import { MANAGEMENT, SECRET } from '@shell/config/types';
import CreateEditView from '@shell/mixins/create-edit-view';
import { LabeledInput } from '@components/Form/LabeledInput';
import ArrayList from '@shell/components/form/ArrayList.vue';
import UnitInput from '@shell/components/form/UnitInput.vue';
import CruResource from '@shell/components/CruResource.vue';
import CopyToClipboardText from '@shell/components/CopyToClipboardText.vue';
import DateComponent from '@shell/components/formatter/Date.vue';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import Loading from '@shell/components/Loading.vue';
import FormValidation from '@shell/mixins/form-validation';

const OIDC_SECRETS_NAMESPACE = 'cattle-oidc-client-secrets';

export const SECRET_ACTION = {
  CREATE: 'create-secret',
  REGEN:  'regen-secret',
  REMOVE: 'remove-secret',
};

const SECRET_ANNOTATION = {
  CREATE: 'cattle.io/oidc-client-secret-create',
  REGEN:  'cattle.io/oidc-client-secret-regenerate',
  REMOVE: 'cattle.io/oidc-client-secret-remove',
};

const DEFAULT_REF_TOKEN_EXP = 3600;
const DEFAULT_TOKEN_EXP = 600;

type SecretActionType = (typeof SECRET_ACTION)[keyof typeof SECRET_ACTION];

interface secretManageData {
    id: string,
    createdAt: string,
    lastFiveCharacters: string,
    lastUsedAt: string,
    decodedData: string,
    displayFullSecret: boolean
}

export default defineComponent({
  components: {
    CruResource,
    LabeledInput,
    ArrayList,
    UnitInput,
    CopyToClipboardText,
    DateComponent,
    Loading
  },

  mixins: [
    CreateEditView,
    FormValidation
  ],

  async fetch() {
    if (this.mode === _VIEW && this.canFetchSecrets) {
      this.secretsData = await this.$store.dispatch('management/findAll', { type: SECRET, opt: { namespaced: OIDC_SECRETS_NAMESPACE } });
    }
  },

  data() {
    let displayFirstSecret = false;
    const schemaOidcClient = this.$store.getters[`management/schemaFor`](MANAGEMENT.OIDC_CLIENT);

    // setup the data for creation scenario
    if (this.mode === _CREATE) {
      this.value.spec = {
        description:                   '',
        refreshTokenExpirationSeconds: DEFAULT_REF_TOKEN_EXP,
        tokenExpirationSeconds:        DEFAULT_TOKEN_EXP
      };
    }

    // this mean that we came from the create screen and we need to display that first secret generated
    if (this.mode === _VIEW && window.history?.state?.displaySecret) {
      displayFirstSecret = true;
      const state = window.history.state;

      if (state?.displaySecret) {
        const { displaySecret, ...cleanedState } = state;

        // let's clean from the browser history state the flag so that when we do a refresh we don't get the same state back (we don't want to show the secret ever again)
        window.history.replaceState(cleanedState, '', window.location.href);
      }
    }

    console.warn('schemaOidcClient', schemaOidcClient);
    console.warn('value', this.value);
    console.warn('displayFirstSecret', displayFirstSecret);

    return {
      displayFirstSecret,
      snapshotSecretsOnLoad: Object.assign({}, this.value?.status?.clientSecrets),
      secretsRegenerated:    [],
      SECRET_ACTION,
      errors:                [],
      secretsData:           [],
      fvFormRuleSets:        [
        { path: 'metadata.name', rules: ['required'] },
        { path: 'spec.redirectURIs', rules: ['required', 'genericUrl'] },
        { path: 'spec.refreshTokenExpirationSeconds', rules: ['required'] },
        { path: 'spec.tokenExpirationSeconds', rules: ['required'] },
      ],
    };
  },

  computed: {
    isCreate(): Boolean {
      return this.mode === _CREATE;
    },
    isEdit(): Boolean {
      return this.mode === _EDIT;
    },
    isView(): Boolean {
      return this.mode === _VIEW;
    },
    finishButtonMode(): string {
      return this.isCreate ? 'registerApplication' : 'saveApplication';
    },
    canFetchSecrets(): Boolean {
      return this.$store.getters[`management/canList`](SECRET);
    },
    clientID(): string {
      return this.value?.status?.clientID || '';
    },
    clientSecrets(): (secretManageData)[] {
      const clientSecrets: (secretManageData)[] = [];

      const actualSecretData: Record<string, any> = this.secretsData?.find((secret: any) => secret.metadata?.namespace === OIDC_SECRETS_NAMESPACE && secret.metadata?.ownerReferences?.find((ref: any) => ref.name === this.value?.id)) || {};
      const oidcClientSecretsData = this.value?.status?.clientSecrets ? Object.entries(this.value?.status?.clientSecrets) : [];

      console.error('actualSecretData k8s resource', actualSecretData);
      console.error('oidcClientSecretsData', oidcClientSecretsData);
      console.error('snapshotSecretsOnLoad', this.snapshotSecretsOnLoad);
      console.error('secretsRegenerated', this.secretsRegenerated);

      oidcClientSecretsData.forEach((item: any, index: number) => {
        if (item[0] && item[1]) {
          const oidcSecretDataKey = item[0];
          const oidcSecretData = item[1];
          const createdAt = oidcSecretData.createdAt && parseInt(oidcSecretData.createdAt) ? new Date(parseInt(oidcSecretData.createdAt) * 1000).toISOString() : '';
          const lastUsedAt = oidcSecretData.lastUsedAt && parseInt(oidcSecretData.lastUsedAt) ? new Date(parseInt(oidcSecretData.lastUsedAt) * 1000).toISOString() : '';
          let displayFullSecret = false;

          // this covers the first render after creation
          if (this.displayFirstSecret && index === 0) {
            displayFullSecret = true;
          // this cover the "add secret" scenario
          } else if (!this.snapshotSecretsOnLoad[oidcSecretDataKey]) {
            displayFullSecret = true;
          }

          // this cover the "regen secret" scenario
          if (this.secretsRegenerated.find((regen: secretManageData) => regen.id === oidcSecretDataKey && regen.lastFiveCharacters !== oidcSecretData.lastFiveCharacters)) {
            displayFullSecret = true;
          }

          clientSecrets.push({
            id:                 oidcSecretDataKey,
            createdAt,
            lastFiveCharacters: oidcSecretData.lastFiveCharacters,
            lastUsedAt,
            decodedData:        actualSecretData.decodedData?.[oidcSecretDataKey] ? actualSecretData.decodedData[oidcSecretDataKey] : '',
            displayFullSecret
          });
        }
      });

      console.error('clientSecrets', clientSecrets);

      return clientSecrets;
    }
  },

  methods: {
    promptSecretsModal(actionType: SecretActionType, secretId: string) {
      this.errors = [];

      this.$store.dispatch('management/promptModal', {
        component:      'OidcClientSecretDialog',
        customClass:    'remove-modal',
        modalWidth:     400,
        height:         'auto',
        styles:         'max-height: 100vh;',
        componentProps: {
          type:     actionType,
          actionCb: async() => {
            try {
              await this.performSecretAction(actionType, secretId);
            } catch (error: any) {
              this.errors.push(error.data);
            }
          }
        }
      });
    },
    async addNewSecret() {
      this.errors = [];

      try {
        await this.performSecretAction(SECRET_ACTION.CREATE);
      } catch (error) {
        this.errors.push(error.data);
      }
    },
    async performSecretAction(actionType: SecretActionType, secret: secretManageData) {
      let isValidAction = false;

      if (!this.value?.metadata?.annotations) {
        this.value.metadata.annotations = {};
      }

      if (actionType === SECRET_ACTION.CREATE) {
        this.value.metadata.annotations[SECRET_ANNOTATION.CREATE] = 'true';
        isValidAction = true;
      } else if (actionType === SECRET_ACTION.REGEN) {
        this.value.metadata.annotations[SECRET_ANNOTATION.REGEN] = secret.id;
        this.secretsRegenerated.push(secret as never);
        isValidAction = true;
      } else if (actionType === SECRET_ACTION.REMOVE) {
        this.value.metadata.annotations[SECRET_ANNOTATION.REMOVE] = secret.id;
        isValidAction = true;
      }

      if (isValidAction) {
        return await this.value.save();
      }

      return false;
    },
    async save(saveCb: Function) {
      this.errors = [];

      console.log('**** VALUE ON SAVE *****', this.value);

      try {
        await this.value.save();
        saveCb(true);

        if (this.isCreate) {
          // let's add a flag so that we know we can display the secret value
          const afterCreateRoute = Object.assign({}, this.value.detailLocation);

          afterCreateRoute.state = { displaySecret: 'true' };
          this.$router.replace(afterCreateRoute);
        } else {
          this.done();
        }
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        saveCb(false);
      }
    }
  }
});
</script>

<template>
  <Loading v-if="!value" />
  <CruResource
    v-else
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :errors="errors || fvUnreportedValidationErrors"
    :validation-passed="fvFormIsValid"
    class="create-edit"
    :finish-button-mode="finishButtonMode"
    @finish="save"
  >
    <div class="mb-40">
      <h2
        v-if="isCreate"
        class="mt-20"
      >
        {{ t('oidcclient.createClient') }}
      </h2>
      <h2
        v-else
        class="mt-20"
      >
        {{ t('oidcclient.clientData') }}
      </h2>
      <div class="row mt-20">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.metadata.name"
            :mode="mode"
            label-key="oidcclient.appName.label"
            :required="true"
            :placeholder="t('oidcclient.appName.placeholder')"
            :rules="fvGetAndReportPathRules('metadata.name')"
            :disabled="!isCreate"
            data-testid="oidc-client-app-name-field"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.spec.description"
            :mode="mode"
            :label="t('oidcclient.appDescription.label')"
            :placeholder="t('oidcclient.appDescription.placeholder')"
            :min-height="30"
            data-testid="oidc-client-app-desc-field"
          />
        </div>
      </div>
      <!-- clientID -->
      <h3
        v-if="!isCreate"
        class="mt-40 mb-40"
      >
        {{ t('oidcclient.clientId') }}:
        <CopyToClipboardText
          :aria-label="t('oidcclient.a11y.copyText.clientId')"
          :text="clientID"
          data-testid="oidc-clients-copy-clipboard-client-id"
        />
      </h3>
      <!-- managing secrets -->
      <div
        v-if="isView"
        class="mb-20"
      >
        <h3 class="mt-20 mb-20">
          {{ t('oidcclient.clientSecrets') }}
        </h3>
        <div
          v-for="(secret, i) in clientSecrets"
          :key="`secret-id-${i}`"
          class="custom-card"
        >
          <div class="custom-card-content">
            <p v-if="secret.displayFullSecret">
              <CopyToClipboardText
                :aria-label="t('oidcclient.a11y.copyText.clientSecret')"
                :text="secret.decodedData"
              />
            </p>
            <p v-else>
              ********{{ secret.lastFiveCharacters }}
            </p>
            <p>{{ t('generic.created') }}: <DateComponent :value="secret.createdAt" /></p>
            <p>
              <span>{{ t('tableHeaders.lastUsed') }}: </span>
              <span v-if="!secret.lastUsedAt">{{ t('oidcclient.usedNever') }}</span>
              <span v-else><DateComponent :value="secret.lastUsedAt" /></span>
            </p>
          </div>
          <div class="custom-card-actions">
            <button
              class="btn-sm role-primary"
              @click="promptSecretsModal(SECRET_ACTION.REGEN, secret)"
            >
              {{ t('oidcclient.regenerate') }}
            </button>
            <button
              class="btn-sm role-primary"
              @click="promptSecretsModal(SECRET_ACTION.REMOVE, secret)"
            >
              {{ t('generic.remove') }}
            </button>
          </div>
        </div>
        <button
          class="btn role-primary mt-20"
          @click="addNewSecret"
        >
          {{ t('oidcclient.addNewSecret') }}
        </button>
      </div>
      <div class="row mt-20">
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
      <div class="row mt-20">
        <div
          class="col span-3"
          data-testid="oidc-client-ref-token-exp-input"
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
          data-testid="oidc-client-token-exp-input"
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

<style lang="scss" scoped>
.custom-card {
  display: flex;
  border: 1px solid black;
  padding: 20px;

  .custom-card-content {
    flex-grow: 1;

    p {
      margin-bottom: 10px;
    }
  }

  .custom-card-actions {
    display: flex;
    flex-direction: column;
    margin-bottom: 20px;

    button:first-child {
      margin-bottom: 10px;
    }
  }
}
</style>
