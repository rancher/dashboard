<script>
import { mapGetters } from 'vuex';
import { AUTH_TYPE, NORMAN, SECRET } from '@shell/config/types';
import { set } from '@shell/utils/object';
import { Banner } from '@components/Banner';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import InputWithSelect from '@shell/components/form/InputWithSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Labels from '@shell/components/form/Labels';
import Loading from '@shell/components/Loading';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import { base64Decode, base64Encode } from '@shell/utils/crypto';
import SelectOrCreateAuthSecret from '@shell/components/form/SelectOrCreateAuthSecret';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import { CATALOG, FLEET as FLEET_LABELS } from '@shell/config/labels-annotations';
import { SECRET_TYPES } from '@shell/config/secret';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import FormValidation from '@shell/mixins/form-validation';
import UnitInput from '@shell/components/form/UnitInput';
import FleetClusterTargets from '@shell/components/fleet/FleetClusterTargets/index.vue';
import { toSeconds } from '@shell/utils/duration';
import FleetGitRepoPaths from '@shell/components/fleet/FleetGitRepoPaths.vue';
import FleetOCIStorageSecret from '@shell/components/fleet/FleetOCIStorageSecret.vue';

const MINIMUM_POLLING_INTERVAL = 15;
const DEFAULT_POLLING_INTERVAL = 60;

const _VERIFY = 'verify';
const _SKIP = 'skip';
const _SPECIFY = 'specify';

export default {
  name: 'CruGitRepo',

  inheritAttrs: false,

  emits: ['input'],

  components: {
    Checkbox,
    Banner,
    CruResource,
    FleetOCIStorageSecret,
    FleetGitRepoPaths,
    InputWithSelect,
    Labels,
    LabeledInput,
    LabeledSelect,
    Loading,
    NameNsDescription,
    SelectOrCreateAuthSecret,
    FleetClusterTargets,
    UnitInput,
  },

  mixins: [CreateEditView, FormValidation],

  async fetch() {
    this.currentUser = await this.value.getCurrentUser();
  },

  data() {
    let tlsMode = _VERIFY;
    let caBundle = null;

    if ( this.value.spec.insecureSkipTLSVerify ) {
      tlsMode = _SKIP;
    } else if ( this.value.spec.caBundle ) {
      try {
        caBundle = base64Decode(this.value.spec.caBundle);
        tlsMode = _SPECIFY;
      } catch (e) {
        // Hmm...
      }
    }

    const correctDriftEnabled = this.value.spec?.correctDrift?.enabled || false;

    let pollingInterval = toSeconds(this.value.spec.pollingInterval) || this.value.spec.pollingInterval;

    if (!pollingInterval) {
      if (this.realMode === _CREATE) {
        pollingInterval = DEFAULT_POLLING_INTERVAL;
        this.value.spec.pollingInterval = this.durationSeconds(pollingInterval);
      } else if (this.realMode === _EDIT || this.realMode === _VIEW) {
        pollingInterval = MINIMUM_POLLING_INTERVAL;
      }
    }

    const ref = ( this.value.spec?.revision ? 'revision' : 'branch' );
    const refValue = this.value.spec?.[ref] || '';

    return {
      currentUser:             {},
      tempCachedValues:        {},
      username:                null,
      password:                null,
      publicKey:               null,
      privateKey:              null,
      caBundle,
      tlsMode,
      correctDriftEnabled,
      pollingInterval,
      ref,
      refValue,
      displayHelmRepoURLRegex: false,
      targetsCreated:          '',
      fvFormRuleSets:          [{
        path:  'spec.repo',
        rules: ['urlRepository'],
      }],
      touched: null,
    };
  },

  computed: {
    ...mapGetters(['workspace']),

    _SPECIFY() {
      return _SPECIFY;
    },

    isGitHubDotComRepository() {
      // It needs to be specifically https://github.com, if different it could have something like https://company-intranet.github.com/ or https://company.com/github.com/
      return this.value.spec.repo?.toLowerCase().includes('https://github.com');
    },

    isBasicAuthSelected() {
      return this.tempCachedValues.clientSecretName?.selected === AUTH_TYPE._BASIC;
    },

    steps() {
      return [
        {
          name:           'stepMetadata',
          title:          this.t('fleet.gitRepo.add.steps.metadata.title'),
          label:          this.t('fleet.gitRepo.add.steps.metadata.label'),
          subtext:        this.t('fleet.gitRepo.add.steps.metadata.subtext'),
          descriptionKey: 'fleet.gitRepo.add.steps.metadata.description',
          ready:          this.isView || !!this.value.metadata.name,
          weight:         1
        },
        {
          name:           'stepRepo',
          title:          this.t('fleet.gitRepo.add.steps.repo.title'),
          label:          this.t('fleet.gitRepo.add.steps.repo.label'),
          subtext:        this.t('fleet.gitRepo.add.steps.repo.subtext'),
          descriptionKey: 'fleet.gitRepo.add.steps.repo.description',
          ready:          this.isView || (!!this.refValue && !!this.fvFormIsValid),
          weight:         1
        },
        {
          name:           'stepTarget',
          title:          this.t('fleet.gitRepo.add.steps.targetInfo.title'),
          label:          this.t('fleet.gitRepo.add.steps.targetInfo.label'),
          subtext:        this.t('fleet.gitRepo.add.steps.targetInfo.subtext'),
          descriptionKey: 'fleet.gitRepo.steps.add.targetInfo.description',
          ready:          this.isView || !!this.fvFormIsValid,
          weight:         1
        },
        {
          name:           'stepAdvanced',
          title:          this.t('fleet.gitRepo.add.steps.advanced.title'),
          label:          this.t('fleet.gitRepo.add.steps.advanced.label'),
          subtext:        this.t('fleet.gitRepo.add.steps.advanced.subtext'),
          descriptionKey: 'fleet.gitRepo.add.steps.advanced.description',
          ready:          !!this.fvFormIsValid,
          weight:         1,
        },
      ];
    },

    isTls() {
      return !(this.value?.spec?.repo || '').startsWith('http://');
    },

    tlsOptions() {
      return [
        { label: this.t('fleet.gitRepo.tls.verify'), value: _VERIFY },
        { label: this.t('fleet.gitRepo.tls.specify'), value: _SPECIFY },
        { label: this.t('fleet.gitRepo.tls.skip'), value: _SKIP },
      ];
    },

    showPollingIntervalWarning() {
      return !this.isView && this.value.isPollingEnabled && this.pollingInterval < MINIMUM_POLLING_INTERVAL;
    },
  },

  watch: {
    tlsMode: {
      handler:   'updateTls',
      immediate: true
    },
    caBundle: {
      handler:   'updateTls',
      immediate: true
    },
    workspace(neu) {
      if ( this.isCreate ) {
        set(this.value, 'metadata.namespace', neu);
      }
    },
  },

  created() {
    this.registerBeforeHook(this.cleanTLS, 'cleanTLS');
    this.registerBeforeHook(this.doCreateSecrets, `registerAuthSecrets${ new Date().getTime() }`, 99);
    this.registerBeforeHook(this.updateBeforeSave);

    if (this.realMode === _EDIT && this.workspace !== this.value.namespace) {
      this.$store.commit('updateWorkspace', { value: this.value.namespace, getters: this.$store.getters });
    }
  },

  methods: {
    updatePaths(value) {
      const { paths, bundles } = value;

      this.value.spec.paths = paths;
      this.value.spec.bundles = bundles;
    },

    set,

    cleanTLS() {
      if (!this.isTls) {
        delete this.value.spec.insecureSkipTLSVerify;
        delete this.value.spec.caBundle;
      }
    },

    updateCachedAuthVal(val, key) {
      this.tempCachedValues[key] = typeof val === 'string' ? { selected: val } : { ...val };

      if (key === 'helmSecretName') {
        this.toggleHelmRepoURLRegex(val && val.selected !== AUTH_TYPE._NONE);
      }
    },

    updateAuth(val, key) {
      const spec = this.value.spec;

      if ( val ) {
        spec[key] = val;
      } else {
        delete spec[key];
      }

      this.updateCachedAuthVal(val, key);
    },

    updateTargets(value) {
      this.value.spec.targets = value;
    },

    toggleHelmRepoURLRegex(active) {
      this.displayHelmRepoURLRegex = active;

      if (!active) {
        delete this.value.spec?.helmRepoURLRegex;
      }
    },

    changeRef({ text, selected }) {
      this.ref = selected;
      this.refValue = text;
      const spec = this.value.spec;

      if ( selected === 'branch' ) {
        spec.branch = text;
        delete spec.revision;
      } else {
        delete spec.branch;
        spec.revision = text;
      }
    },

    async doCreateSecrets() {
      if (this.tempCachedValues.clientSecretName) {
        await this.doCreate('clientSecretName', this.tempCachedValues.clientSecretName);
      }

      if (this.tempCachedValues.helmSecretName) {
        await this.doCreate('helmSecretName', this.tempCachedValues.helmSecretName);
      }
    },

    async doCreate(name, credentials) {
      const {
        selected,
        publicKey,
        privateKey,
        sshKnownHosts
      } = credentials;

      if ( ![AUTH_TYPE._SSH, AUTH_TYPE._BASIC, AUTH_TYPE._S3].includes(selected) ) {
        return;
      }

      let secret;

      if ( selected === AUTH_TYPE._S3 ) {
        secret = await this.$store.dispatch(`rancher/create`, {
          type:               NORMAN.CLOUD_CREDENTIAL,
          s3credentialConfig: {
            accessKey: publicKey,
            secretKey: privateKey,
          },
        });
      } else {
        secret = await this.$store.dispatch(`${ CATALOG._MANAGEMENT }/create`, {
          type:     SECRET,
          metadata: {
            namespace:    this.value.metadata.namespace,
            generateName: 'auth-',
            labels:       { [FLEET_LABELS.MANAGED]: 'true' }
          }
        });

        let type, publicField, privateField;

        switch ( selected ) {
        case AUTH_TYPE._SSH:
          type = SECRET_TYPES.SSH;
          publicField = 'ssh-publickey';
          privateField = 'ssh-privatekey';
          break;
        case AUTH_TYPE._BASIC:
          type = SECRET_TYPES.BASIC;
          publicField = 'username';
          privateField = 'password';
          break;
        default:
          throw new Error('Unknown type');
        }

        secret._type = type;
        secret.data = {
          [publicField]:  base64Encode(publicKey),
          [privateField]: base64Encode(privateKey),
        };

        // Add ssh known hosts
        if (selected === AUTH_TYPE._SSH && sshKnownHosts) {
          secret.data.known_hosts = base64Encode(sshKnownHosts);
        }
      }

      await secret.save();

      await this.$nextTick(() => {
        this.updateAuth(secret.metadata.name, name);
      });

      return secret;
    },

    updateTlsMode(event) {
      this.tlsMode = event;
    },

    updateTls() {
      const spec = this.value.spec;

      if ( this.tlsMode === _SPECIFY ) {
        spec.insecureSkipTLSVerify = false;
        const caBundle = (this.caBundle || '').trim();

        if ( caBundle ) {
          spec.caBundle = base64Encode(`${ caBundle }\n`);
        } else {
          delete spec.caBundle;
        }
      } else {
        if ( this.tlsMode === _SKIP ) {
          spec.insecureSkipTLSVerify = true;
        } else {
          spec.insecureSkipTLSVerify = false;
        }

        if ( this.liveValue.caBundle ) {
          spec.caBundle = this.liveValue.caBundle;
        } else {
          delete spec.caBundle;
        }
      }
    },

    enablePolling(value) {
      if (value) {
        delete this.value.spec.disablePolling;
      } else {
        this.value.spec.disablePolling = true;
      }
    },

    updatePollingInterval(value) {
      if (!value) {
        this.pollingInterval = DEFAULT_POLLING_INTERVAL;
        this.value.spec.pollingInterval = this.durationSeconds(DEFAULT_POLLING_INTERVAL);
      } else if (value === MINIMUM_POLLING_INTERVAL) {
        delete this.value.spec.pollingInterval;
      } else {
        this.value.spec.pollingInterval = this.durationSeconds(value);
      }
    },

    updateBeforeSave() {
      this.value.spec['correctDrift'] = { enabled: this.correctDriftEnabled };

      if (this.mode === _CREATE) {
        this.value.metadata.labels[FLEET_LABELS.CREATED_BY_USER_ID] = this.currentUser.id;
      }
    },

    durationSeconds(value) {
      return `${ value }s`;
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />

  <CruResource
    v-else
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="true"
    :errors="errors"
    :steps="steps"
    :finish-mode="'finish'"
    class="wizard"
    @cancel="done"
    @error="e=>errors = e"
    @finish="save"
  >
    <template #stepMetadata>
      <NameNsDescription
        v-if="!isView"
        :value="value"
        :namespaced="false"
        :mode="mode"
        @update:value="$emit('input', $event)"
      />
      <Labels
        :value="value"
        :mode="mode"
        :display-side-by-side="false"
        :add-icon="'icon-plus'"
      />
    </template>
    <template #stepRepo>
      <h2 v-t="'fleet.gitRepo.repo.title'" />
      <div
        class="row mb-20"
        :class="{'mt-20': isView}"
      >
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.spec.repo"
            :mode="mode"
            label-key="fleet.gitRepo.repo.label"
            :placeholder="t('fleet.gitRepo.repo.placeholder', null, true)"
            :required="true"
            :rules="fvGetAndReportPathRules('spec.repo')"
          />
        </div>
        <div class="col span-6">
          <InputWithSelect
            :data-testid="`gitrepo-${ref}`"
            :mode="mode"
            :select-label="t('fleet.gitRepo.ref.label')"
            :select-value="ref"
            :text-label="t(`fleet.gitRepo.ref.${ref}Label`)"
            :text-placeholder="t(`fleet.gitRepo.ref.${ref}Placeholder`)"
            :text-value="refValue"
            :text-required="true"
            :options="[{label: t('fleet.gitRepo.ref.branch'), value: 'branch'}, {label: t('fleet.gitRepo.ref.revision'), value: 'revision'}]"
            @update:value="changeRef($event)"
          />
        </div>
      </div>

      <FleetGitRepoPaths
        :value="{
          paths: value.spec.paths,
          bundles: value.spec.bundles
        }"
        :mode="mode"
        :touched="touched"
        @update:value="updatePaths"
        @touched="touched=$event"
      />
    </template>

    <template #stepAdvanced>
      <Banner
        v-if="!isView"
        color="info"
        label-key="fleet.gitRepo.add.steps.advanced.info"
        data-testid="gitrepo-advanced-info"
      />

      <h2 v-t="'fleet.gitRepo.auth.title'" />

      <Banner
        v-if="isGitHubDotComRepository && isBasicAuthSelected"
        color="warning"
        label-key="fleet.gitRepo.auth.githubdotcomPasswordBanner"
        data-testid="gitrepo-githubdotcom-password-warning"
      />
      <SelectOrCreateAuthSecret
        data-testid="gitrepo-git-auth"
        :value="value.spec.clientSecretName"
        :register-before-hook="registerBeforeHook"
        :namespace="value.metadata.namespace"
        :delegate-create-to-parent="true"
        in-store="management"
        :pre-select="tempCachedValues.clientSecretName"
        :mode="mode"
        generate-name="gitrepo-auth-"
        label-key="fleet.gitRepo.auth.git"
        :cache-secrets="true"
        :show-ssh-known-hosts="true"
        :is-github-dot-com-repository="isGitHubDotComRepository"
        @update:value="updateAuth($event, 'clientSecretName')"
        @inputauthval="updateCachedAuthVal($event, 'clientSecretName')"
      />
      <SelectOrCreateAuthSecret
        data-testid="gitrepo-helm-auth"
        :value="value.spec.helmSecretName"
        :register-before-hook="registerBeforeHook"
        :namespace="value.metadata.namespace"
        :delegate-create-to-parent="true"
        in-store="management"
        :mode="mode"
        generate-name="helmrepo-auth-"
        label-key="fleet.gitRepo.auth.helm"
        :pre-select="tempCachedValues.helmSecretName"
        :cache-secrets="true"
        :show-ssh-known-hosts="true"
        @update:value="updateAuth($event, 'helmSecretName')"
        @inputauthval="updateCachedAuthVal($event, 'helmSecretName')"
      />

      <div
        v-if="displayHelmRepoURLRegex"
        class="row mt-20"
      >
        <div
          class="col span-6"
          data-testid="gitrepo-helm-repo-url-regex"
        >
          <LabeledInput
            v-model:value="value.spec.helmRepoURLRegex"
            :mode="mode"
            label-key="fleet.gitRepo.helmRepoURLRegex"
          />
        </div>
      </div>

      <template v-if="isTls">
        <div class="row mt-20">
          <div class="col span-6">
            <LabeledSelect
              :label="t('fleet.gitRepo.tls.label')"
              :mode="mode"
              :value="tlsMode"
              :options="tlsOptions"
              @update:value="updateTlsMode($event)"
            />
          </div>
          <div
            v-if="tlsMode === _SPECIFY"
            class="col span-6"
          >
            <LabeledInput
              v-model:value="caBundle"
              :mode="mode"
              type="multiline"
              label-key="fleet.gitRepo.caBundle.label"
              placeholder-key="fleet.gitRepo.caBundle.placeholder"
            />
          </div>
        </div>
      </template>
      <div class="spacer" />

      <h2 v-t="'fleet.gitRepo.ociStorageSecret.title'" />
      <div class="row mt-20">
        <div class="col span-6">
          <FleetOCIStorageSecret
            :secret="value.spec.ociRegistrySecret"
            :workspace="workspace"
            :mode="mode"
            @update:value="value.spec.ociRegistrySecret=$event"
          />
        </div>
      </div>
      <div class="spacer" />

      <h2 v-t="'fleet.gitRepo.resources.label'" />
      <div class="resource-handling">
        <Checkbox
          v-model:value="correctDriftEnabled"
          :tooltip="t('fleet.gitRepo.resources.correctDriftTooltip')"
          data-testid="gitRepo-correctDrift-checkbox"
          class="check"
          type="checkbox"
          label-key="fleet.gitRepo.resources.correctDrift"
          :mode="mode"
        />
        <Checkbox
          v-model:value="value.spec.keepResources"
          :tooltip="t('fleet.gitRepo.resources.keepResourcesTooltip')"
          data-testid="gitRepo-keepResources-checkbox"
          class="check"
          type="checkbox"
          label-key="fleet.gitRepo.resources.keepResources"
          :mode="mode"
        />
      </div>

      <div class="spacer" />
      <h2 v-t="'fleet.gitRepo.polling.label'" />
      <div class="row polling">
        <div class="col span-6">
          <Checkbox
            :value="value.isPollingEnabled"
            data-testid="gitRepo-enablePolling-checkbox"
            class="check"
            type="checkbox"
            label-key="fleet.gitRepo.polling.enable"
            :mode="mode"
            @update:value="enablePolling"
          />
        </div>
        <template v-if="value.isPollingEnabled">
          <div class="col">
            <Banner
              v-if="showPollingIntervalWarning"
              color="warning"
              label-key="fleet.gitRepo.polling.pollingInterval.minimumValueWarning"
              data-testid="gitRepo-pollingInterval-minimumValueWarning"
            />
            <Banner
              v-if="value.isWebhookConfigured"
              color="warning"
              label-key="fleet.gitRepo.polling.pollingInterval.webhookWarning"
              data-testid="gitRepo-pollingInterval-webhookWarning"
            />
          </div>
          <div class="col span-6">
            <UnitInput
              v-model:value="pollingInterval"
              data-testid="gitRepo-pollingInterval-input"
              min="1"
              :suffix="t('suffix.seconds', { count: pollingInterval })"
              :label="t('fleet.gitRepo.polling.pollingInterval.label')"
              :mode="mode"
              tooltip-key="fleet.gitRepo.polling.pollingInterval.tooltip"
              @blur.capture="updatePollingInterval(pollingInterval)"
            />
          </div>
        </template>
      </div>
    </template>

    <template #stepTarget>
      <h2 v-t="'fleet.gitRepo.target.label'" />
      <FleetClusterTargets
        :targets="value.spec.targets"
        :matching="value.targetClusters"
        :namespace="value.metadata.namespace"
        :mode="realMode"
        :created="targetsCreated"
        @update:value="updateTargets"
        @created="targetsCreated=$event"
      />

      <h3 class="mmt-16">
        {{ t('fleet.gitRepo.target.additionalOptions') }}
      </h3>
      <div class="row mt-20">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.spec.serviceAccount"
            :mode="mode"
            label-key="fleet.gitRepo.serviceAccount.label"
            placeholder-key="fleet.gitRepo.serviceAccount.placeholder"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.spec.targetNamespace"
            :mode="mode"
            label-key="fleet.gitRepo.targetNamespace.label"
            placeholder-key="fleet.gitRepo.targetNamespace.placeholder"
            label="Target Namespace"
            placeholder="Optional: Require all resources to be in this namespace"
          />
        </div>
      </div>
    </template>
  </CruResource>
</template>

<style lang="scss" scoped>
  .spacer {
    padding: 30px 0 0 0;
  }
  :deep() .select-or-create-auth-secret {
    .row {
      margin-top: 10px !important;
    }
  }
  :deep() .input-container .in-input.labeled-select {
    min-width: 110px;
    width: 20%;
  }
  .resource-handling {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .polling {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
</style>
