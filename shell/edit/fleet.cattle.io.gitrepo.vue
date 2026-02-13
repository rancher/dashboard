<script>
import { mapGetters } from 'vuex';
import { AUTH_TYPE, NORMAN, SECRET } from '@shell/config/types';
import { set } from '@shell/utils/object';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import Loading from '@shell/components/Loading';
import { base64Decode, base64Encode } from '@shell/utils/crypto';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import { CATALOG, FLEET as FLEET_LABELS } from '@shell/config/labels-annotations';
import { SECRET_TYPES } from '@shell/config/secret';
import FormValidation from '@shell/mixins/form-validation';
import { toSeconds } from '@shell/utils/duration';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import GitRepoMetadataTab from '@shell/components/fleet/GitRepoMetadataTab.vue';
import GitRepoRepositoryTab from '@shell/components/fleet/GitRepoRepositoryTab.vue';
import GitRepoTargetTab from '@shell/components/fleet/GitRepoTargetTab.vue';
import GitRepoAdvancedTab from '@shell/components/fleet/GitRepoAdvancedTab.vue';
import NameNsDescription from '@shell/components/form/NameNsDescription';

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
    CruResource,
    Loading,
    Tabbed,
    Tab,
    GitRepoMetadataTab,
    GitRepoRepositoryTab,
    GitRepoTargetTab,
    GitRepoAdvancedTab,
    NameNsDescription,
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
      displayHelmRepoUrlRegex: false,
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

    isGithubDotComRepository() {
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
      this.displayHelmRepoUrlRegex = active;

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
    :steps="!isView ? steps : undefined"
    :finish-mode="'finish'"
    class="wizard"
    @cancel="done"
    @error="e=>errors = e"
    @finish="save"
  >
    <template #stepMetadata>
      <GitRepoMetadataTab
        :value="value"
        :mode="mode"
        :is-view="isView"
        @input="$emit('input', $event)"
      />
    </template>
    <template #stepRepo>
      <GitRepoRepositoryTab
        :value="value"
        :mode="mode"
        :is-view="isView"
        :ref-type="ref"
        :ref-value="refValue"
        :touched="touched"
        :fv-get-and-report-path-rules="fvGetAndReportPathRules"
        @update:ref="changeRef"
        @update:paths="updatePaths"
        @touched="touched=$event"
      />
    </template>

    <template #stepAdvanced>
      <GitRepoAdvancedTab
        :value="value"
        :mode="mode"
        :is-view="isView"
        :workspace="workspace"
        :tls-mode="tlsMode"
        :tls-options="tlsOptions"
        :ca-bundle="caBundle"
        :is-tls="isTls"
        :display-helm-repo-url-regex="displayHelmRepoUrlRegex"
        :temp-cached-values="tempCachedValues"
        :correct-drift-enabled="correctDriftEnabled"
        :polling-interval="pollingInterval"
        :show-polling-interval-warning="showPollingIntervalWarning"
        :specify-option="_SPECIFY"
        :register-before-hook="registerBeforeHook"
        :is-github-dot-com-repository="isGithubDotComRepository"
        :is-basic-auth-selected="isBasicAuthSelected"
        @update:tls-mode="updateTlsMode"
        @update:ca-bundle="caBundle = $event"
        @update:auth="updateAuth($event.value, $event.key)"
        @update:cached-auth="updateCachedAuthVal($event.value, $event.key)"
        @update:correct-drift="correctDriftEnabled = $event"
        @update:polling-enabled="enablePolling"
        @update:polling-interval="updatePollingInterval"
      />
    </template>

    <template #stepTarget>
      <GitRepoTargetTab
        :value="value"
        :mode="mode"
        :real-mode="realMode"
        :targets-created="targetsCreated"
        @update:targets="updateTargets"
        @created="targetsCreated=$event"
      />
    </template>

    <template
      v-if="isView"
      #single
    >
      <NameNsDescription
        :value="value"
        :namespaced="false"
        :mode="mode"
        @update:value="$emit('input', $event)"
      />

      <Tabbed
        v-if="isView && steps.length === 4"
        :side-tabs="true"
        :use-hash="true"
      >
        <Tab
          v-if="steps[1]"
          :name="steps[1].name"
          :label="steps[1].label"
          :weight="3"
        >
          <GitRepoRepositoryTab
            :value="value"
            :mode="mode"
            :is-view="isView"
            :ref-type="ref"
            :ref-value="refValue"
            :touched="touched"
            :fv-get-and-report-path-rules="fvGetAndReportPathRules"
            @update:ref="changeRef"
            @update:paths="updatePaths"
            @touched="touched=$event"
          />
        </Tab>
        <Tab
          v-if="steps[2]"
          :name="steps[2].name"
          :label="steps[2].label"
          :weight="2"
        >
          <GitRepoTargetTab
            :value="value"
            :mode="mode"
            :real-mode="realMode"
            :targets-created="targetsCreated"
            @update:targets="updateTargets"
            @created="targetsCreated=$event"
          />
        </Tab>
        <Tab
          v-if="steps[3]"
          :name="steps[3].name"
          :label="steps[3].label"
          :weight="1"
        >
          <GitRepoAdvancedTab
            :value="value"
            :mode="mode"
            :is-view="isView"
            :workspace="workspace"
            :tls-mode="tlsMode"
            :tls-options="tlsOptions"
            :ca-bundle="caBundle"
            :is-tls="isTls"
            :display-helm-repo-url-regex="displayHelmRepoUrlRegex"
            :temp-cached-values="tempCachedValues"
            :correct-drift-enabled="correctDriftEnabled"
            :polling-interval="pollingInterval"
            :show-polling-interval-warning="showPollingIntervalWarning"
            :specify-option="_SPECIFY"
            :register-before-hook="registerBeforeHook"
            @update:tls-mode="updateTlsMode"
            @update:ca-bundle="caBundle = $event"
            @update:auth="updateAuth($event.value, $event.key)"
            @update:cached-auth="updateCachedAuthVal($event.value, $event.key)"
            @update:correct-drift="correctDriftEnabled = $event"
            @update:polling-enabled="enablePolling"
            @update:polling-interval="updatePollingInterval"
          />
        </Tab>
        <Tab
          name="labels"
          label-key="generic.labelsAndAnnotations"
          :weight="4"
        >
          <GitRepoMetadataTab
            :value="value"
            :mode="mode"
            :is-view="isView"
            @input="$emit('input', $event)"
          />
        </Tab>
      </Tabbed>
    </template>
  </CruResource>
</template>

<style lang="scss" scoped>
  :deep() .input-container .in-input.labeled-select {
    min-width: 110px;
    width: 20%;
  }
</style>
